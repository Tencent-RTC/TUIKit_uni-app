<template>
    <view class="modal-overlay" @click="handleClose">
        <view class="modal-content" @click.stop>
            <view class="modal-header">
                <text class="modal-title">创建群聊</text>
                <view class="close-btn" @click="handleClose">×</view>
            </view>

            <scroll-view class="form-container" scroll-y>
                <view class="form-item">
                    <text class="form-label">群名称</text>
                    <input class="form-input" v-model="groupForm.name" placeholder="请输入群名称" />
                </view>



                <view class="form-item">
                    <text class="form-label">群ID（可选）</text>
                    <input class="form-input" v-model="groupForm.groupID" placeholder="请输入群ID，不填则自动生成" />
                </view>

                <view class="form-item">
                    <text class="form-label">群介绍（可选）</text>
                    <textarea class="form-textarea" v-model="groupForm.introduction" placeholder="请输入群介绍" />
                </view>

                <view class="form-item">
                    <text class="form-label">群头像（可选）</text>
                    <input class="form-input" v-model="groupForm.avatar" placeholder="请输入群头像URL" />
                </view>
            </scroll-view>

            <view class="modal-footer">
                <button class="cancel-btn" @click="handleClose">取消</button>
                <button class="submit-btn" @click="handleSubmit">创建群聊</button>
            </view>
        </view>
    </view>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';

interface Emits {
    (e: 'close', value: boolean): void
    (e: 'submit', groupInfo: any): void
}

const emit = defineEmits<Emits>()

const groupForm = reactive({
    name: '',
    groupID: '',
    introduction: '',
    avatar: ''
})



// 关闭弹窗
const handleClose = () => {
    emit('close', false)
    resetForm()
}

// 提交表单
const handleSubmit = () => {
    if (!groupForm.name.trim()) {
        uni.showToast({
            title: '请输入群名称',
            icon: 'none'
        })
        return
    }

    const groupInfo = {
        name: groupForm.name,
        groupID: groupForm.groupID || '',
        introduction: groupForm.introduction || '',
        avatar: groupForm.avatar || '',
    }

    emit('submit', groupInfo)
    handleClose()
}

const resetForm = () => {
    groupForm.name = ''
    groupForm.groupID = ''
    groupForm.introduction = ''
    groupForm.avatar = ''
}
</script>

<style lang="scss" scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    width: 100%;
    max-height: 80vh;
    background-color: #fff;
    border-radius: 24rpx 24rpx 0 0;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease-out;
    box-sizing: border-box;
    overflow: hidden;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }

    to {
        transform: translateY(0);
    }
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 30rpx 24rpx;
    border-bottom: 1rpx solid #e8e8e8;
    position: relative;
    box-sizing: border-box;
}

.modal-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1a1a1a;
    flex: 1;
    text-align: center;
}

.close-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    color: #999;
    position: absolute;
    right: 30rpx;
}

.form-container {
    flex: 1;
    max-height: 80vh;
    padding: 30rpx;
    overflow: hidden;
    box-sizing: border-box;
}

.form-item {
    margin-bottom: 32rpx;
    box-sizing: border-box;
}

.form-label {
    display: block;
    font-size: 28rpx;
    color: #1a1a1a;
    margin-bottom: 16rpx;
    font-weight: 500;
}

.form-input {
    width: 100%;
    height: 80rpx;
    padding: 0 24rpx;
    background-color: #f8f9fa;
    border: 1rpx solid #e8e8e8;
    border-radius: 8rpx;
    font-size: 28rpx;
    box-sizing: border-box;
}



.form-textarea {
    width: 100%;
    min-height: 160rpx;
    padding: 24rpx;
    background-color: #f8f9fa;
    border: 1rpx solid #e8e8e8;
    border-radius: 8rpx;
    font-size: 28rpx;
    line-height: 1.5;
    box-sizing: border-box;
}

.modal-footer {
    display: flex;
    gap: 20rpx;
    padding: 24rpx 30rpx 40rpx;
    border-top: 1rpx solid #e8e8e8;
    box-sizing: border-box;
}

.cancel-btn {
    flex: 1;
    height: 80rpx;
    background-color: #f8f9fa;
    color: #666;
    border: 1rpx solid #e8e8e8;
    border-radius: 8rpx;
    font-size: 28rpx;
    box-sizing: border-box;
}

.submit-btn {
    flex: 1;
    height: 80rpx;
    background-color: #07c160;
    color: #fff;
    border: none;
    border-radius: 8rpx;
    font-size: 28rpx;
    box-sizing: border-box;
}

.cancel-btn:active {
    background-color: #e8e8e8;
}

.submit-btn:active {
    background-color: #06a854;
}
</style>