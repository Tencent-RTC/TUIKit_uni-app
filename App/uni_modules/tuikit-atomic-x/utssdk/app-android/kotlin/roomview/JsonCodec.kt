package uts.sdk.modules.atomicx.kotlin.roomview

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.TypeAdapter
import com.google.gson.TypeAdapterFactory
import com.google.gson.reflect.TypeToken
import com.google.gson.stream.JsonReader
import com.google.gson.stream.JsonToken
import com.google.gson.stream.JsonWriter

/**
 * Self-contained JSON helpers for decoding payloads produced by
 * `TUIRoomEngine.call` / `TUIRoomObserver.on`.
 *
 * Two pieces:
 *  - [JsonCodec]: a [Gson] instance that (de)serializes enums by their integer
 *    `value` field (matching the wire format used on the engine bridge).
 *  - [parseAt] / [parseListAt]: read a single named field out of a top-level
 *    JSON object without materializing the whole tree.
 */
internal object JsonCodec {
    val gson: Gson = GsonBuilder()
        .serializeNulls()
        .registerTypeAdapterFactory(IntValuedEnumAdapterFactory())
        .create()
}

/**
 * Reads a single field [key] out of a top-level JSON object string and decodes
 * it as [T] using [JsonCodec]. Returns `null` if the input is empty, not an
 * object, the key is missing, or decoding fails.
 *
 * Streaming via [JsonReader] avoids the cost of building the full object tree
 * for payloads where we only care about one or two top-level fields.
 */
internal inline fun <reified T> String.parseAt(key: String): T? {
    if (this.isEmpty()) return null
    return runCatching {
        JsonReader(this.reader()).use { reader ->
            if (reader.peek() != JsonToken.BEGIN_OBJECT) return@runCatching null
            reader.beginObject()
            while (reader.hasNext()) {
                if (reader.nextName() == key) {
                    return@runCatching JsonCodec.gson.fromJson<T>(reader, T::class.java)
                }
                reader.skipValue()
            }
            null
        }
    }.getOrNull()
}

/**
 * Like [parseAt], but for a JSON array field decoded into `List<T>`. Returns
 * an empty list on any failure (missing key, malformed input, etc.) so callers
 * don't have to deal with `null`.
 */
internal inline fun <reified T> String.parseListAt(key: String): List<T> {
    if (this.isEmpty()) return emptyList()
    return runCatching {
        JsonReader(this.reader()).use { reader ->
            if (reader.peek() != JsonToken.BEGIN_OBJECT) return@runCatching emptyList<T>()
            reader.beginObject()
            while (reader.hasNext()) {
                if (reader.nextName() == key) {
                    val listType = TypeToken.getParameterized(List::class.java, T::class.java).type
                    return@runCatching JsonCodec.gson.fromJson<List<T>>(reader, listType) ?: emptyList()
                }
                reader.skipValue()
            }
            emptyList()
        }
    }.getOrElse { emptyList() }
}

/**
 * Decodes enum types by their integer `value` field, matching the wire format
 * produced by `TUIRoomEngine.call` / `TUIRoomObserver.on`.
 *
 * Falls back to `enum.name` matching for enums that don't expose a `value`
 * field, so plain Kotlin enums in the same payload still decode correctly.
 */
private class IntValuedEnumAdapterFactory : TypeAdapterFactory {
    override fun <T> create(gson: Gson, type: TypeToken<T>): TypeAdapter<T>? {
        val rawType = type.rawType
        if (!rawType.isEnum) return null
        @Suppress("UNCHECKED_CAST")
        return IntValuedEnumAdapter(rawType as Class<out Enum<*>>) as TypeAdapter<T>
    }
}

private class IntValuedEnumAdapter<T : Enum<*>>(
    private val enumClass: Class<T>
) : TypeAdapter<T>() {

    private val valueField = try {
        enumClass.getDeclaredField("value").apply { isAccessible = true }
    } catch (e: NoSuchFieldException) {
        null
    }
    private val isIntValue = valueField?.type == Int::class.java || valueField?.type == Integer.TYPE

    override fun write(out: JsonWriter, value: T?) {
        if (value == null) {
            out.nullValue()
            return
        }
        if (valueField != null && isIntValue) {
            (valueField.get(value) as? Int)?.let {
                out.value(it)
                return
            }
        }
        out.value(value.name)
    }

    override fun read(`in`: JsonReader): T? {
        if (`in`.peek() == JsonToken.NULL) {
            `in`.nextNull()
            return null
        }
        val constants = enumClass.enumConstants ?: return null
        return when (`in`.peek()) {
            JsonToken.NUMBER -> {
                val intValue = `in`.nextInt()
                if (valueField != null && isIntValue) {
                    constants.firstOrNull { (valueField.get(it) as? Int) == intValue }
                } else {
                    null
                }
            }
            JsonToken.STRING -> {
                val name = `in`.nextString()
                constants.firstOrNull { it.name == name }
            }
            else -> {
                `in`.skipValue()
                null
            }
        }
    }
}
