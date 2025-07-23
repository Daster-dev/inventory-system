// فلترة الأقسام
const filter = document.getElementById('filterCategory');
if (filter) {
  filter.onchange = () => {
    location.href = '/products' + (filter.value ? '?category=' + filter.value : '');
  };
}

// بيع سريع
document.querySelectorAll('.sell-btn').forEach(btn => {
  btn.onclick = () => {
    fetch('/sales/quick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'productId=' + btn.dataset.id
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
          const show = confirm(data.message + '\n\nهل تريد عرض الفاتورة الآن؟');
          if (show && data.receipt) {
            location.href = data.receipt;
          } else {
            location.reload();
          }
        } else {
          alert(data.message);
        }

    });

  };
});



// البخث بالمنتجات
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.toLowerCase();
    document.querySelectorAll('.product-card').forEach(card => {
      const name = card.dataset.name || '';
      card.style.display = name.includes(keyword) ? 'inline-block' : 'none';
    });
  });
}



  function toggleMenu() {
    document.getElementById('navMenu').classList.toggle('show');
  }






function imgClick() {
  const cardIMG = document.getElementById('imgClick');
  if (cardIMG) {
    cardIMG.addEventListener('click', function(e) {
        e.stopPropagation(); // حتى لا ينفذ حدث document
      cardIMG.classList.toggle('imgClick');
    });
  }
}
imgClick()

function setupImgClickToggle() {
  document.addEventListener('click', function() {
    document.querySelectorAll('#imgClick').forEach(img => {
      img.classList.remove('imgClick');
    });
  });
}

setupImgClickToggle();
