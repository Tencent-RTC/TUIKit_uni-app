// 简单的搜索功能实现
function search(filter) {
  filter = filter.toUpperCase();
  const sections = document.querySelectorAll('section');
  
  sections.forEach(section => {
    const text = section.textContent || section.innerText;
    if (text.toUpperCase().indexOf(filter) > -1) {
      section.style.display = "block";
    } else {
      section.style.display = "none";
    }
  });
}

// 页面加载完成后初始化
window.onload = function() {
  console.log('搜索功能已加载');
};