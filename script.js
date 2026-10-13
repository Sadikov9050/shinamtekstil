const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');
const navLinks = document.querySelectorAll('.nav-link');
const form = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');
const phoneInput = document.querySelector('#phone');

function setMenu(open) {
  menuToggle?.classList.toggle('is-open', open);
  primaryNav?.classList.toggle('is-open', open);
  menuToggle?.setAttribute('aria-expanded', String(open));
}

menuToggle?.addEventListener('click', () => {
  setMenu(!primaryNav.classList.contains('is-open'));
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const revealItems = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const sectionLinks = [...document.querySelectorAll('.nav-link')];
const sections = sectionLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  sections.forEach((section) => activeObserver.observe(section));
}

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '').slice(0, 12);
  if (digits.startsWith('998')) digits = digits.slice(3);
  if (digits.startsWith('8') && digits.length === 10) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  if (!digits) return '';
  const parts = digits.match(/(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})/);
  return parts ? `+998${parts[1] ? ` ${parts[1]}` : ''}${parts[2] ? ` ${parts[2]}` : ''}${parts[3] ? ` ${parts[3]}` : ''}${parts[4] ? ` ${parts[4]}` : ''}` : '';
}

phoneInput?.addEventListener('blur', (event) => {
  event.target.value = normalizePhone(event.target.value);
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  formStatus.classList.remove('is-error');
  const name = form.elements.name.value.trim();
  const phone = normalizePhone(form.elements.phone.value);
  form.elements.phone.value = phone;
  if (!name || !/^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(phone)) {
    formStatus.classList.add('is-error');
    formStatus.textContent = 'Iltimos, ism va to‘g‘ri telefon raqamingizni kiriting.';
    return;
  }
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.classList.add('is-loading');
  formStatus.textContent = 'Xabaringiz yuborilmoqda…';

  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      phone,
      message: form.elements.message.value.trim(),
    }),
  })
    .then(async (response) => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'telegram_unavailable');
      formStatus.textContent = 'Rahmat! Murojaatingiz Telegram orqali qabul qilindi.';
      form.reset();
    })
    .catch((error) => {
      formStatus.classList.add('is-error');
      formStatus.textContent = error.message === 'telegram_not_configured'
        ? 'Telegram qabul kanali hali sozlanmagan. Iltimos, keyinroq urinib ko‘ring.'
        : 'Xabar yuborilmadi. Iltimos, telefon orqali bog‘laning.';
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.classList.remove('is-loading');
    });
});

const productData = {
  mattress: {
    kicker: 'Uyqu uchun',
    title: 'Qulay matraslar',
    image: 'assets/products/mattress.webp',
    alt: 'Yorug‘ xonadagi qulay to‘shak va matras',
    description: 'Tanaga mos qulaylik va uzoq xizmat muddati uchun ishlab chiqilgan matraslar. Uy, mehmonxona va maxsus buyurtmalar uchun yechimlar.',
    features: ['Yumshoq va mustahkam qatlamlar', 'O‘lcham bo‘yicha tayyorlash imkoniyati', 'Uyqu va dam olish uchun ergonomik yechim'],
  },
  pillows: {
    kicker: 'Muloyim g‘amxo‘rlik',
    title: 'Yostiq va adyollar',
    image: 'assets/products/pillows.webp',
    alt: 'Oq yumshoq yostiqning yuqoridan ko‘rinishi',
    description: 'Kundalik shinamlikni ko‘paytiradigan havo o‘tkazuvchi yostiq va adyollar. Tabiiy tolalar bilan muloyim, parvarishi oson tekstura.',
    features: ['Yengil va havo o‘tkazuvchi to‘ldirma', 'Turli o‘lcham va zichlik variantlari', 'Uy va mehmonxona kolleksiyalari uchun mos'],
  },
  sheets: {
    kicker: 'Yotoqxona uchun',
    title: 'Nafis choyshablar to‘plami',
    image: 'assets/products/sheets.webp',
    alt: 'Yotoq uchun oq va tabiiy ranglardagi choyshablar',
    description: 'Yotoqxonaga toza ko‘rinish va sokin kayfiyat beradigan choyshablar. Yumshoqlik, o‘lcham aniqligi va kundalik qulaylik bir to‘plamda.',
    features: ['Yumshoq, teriga yoqimli yuzasi', 'To‘plam tarkibini buyurtmaga moslash', 'Rang va o‘lcham tanlovi mavjud'],
  },
  medical: {
    kicker: 'Maxsus yo‘nalish',
    title: 'Tibbiyot muassasalari uchun maxsus matolar',
    image: 'assets/products/medical.webp',
    alt: 'Tibbiyot muassasasi yotog‘idagi oq tibbiy choyshab',
    description: 'Tozalik, amaliyot va chidamlilik birinchi o‘rinda turadigan muassasalar uchun funksional mato yechimlari.',
    features: ['Gigiyena talablariga mos foydalanish', 'Tez-tez yuvishga chidamli tuzilma', 'Muassasa ehtiyojiga mos hajm va yetkazib berish'],
  },
  hpp: {
    kicker: 'Texnik yechim',
    title: 'Zamonaviy HPP matolari',
    image: 'assets/products/hpp.webp',
    alt: 'Oq va ko‘k rangdagi to‘qilmagan HPP mato rollari',
    description: 'To‘qilmagan polotno — yengil, bir xil tuzilishga ega va maxsus ishlab chiqarish jarayonlari uchun moslashuvchan material.',
    features: ['Bir xil zichlikdagi silliq polotno', 'Rulon ko‘rinishida yetkazib berish', 'Tibbiy va texnik mahsulotlar uchun mos'],
  },
};

const productModal = document.querySelector('#product-modal');
const modalImage = document.querySelector('#modal-image');
const modalKicker = document.querySelector('#modal-kicker');
const modalTitle = document.querySelector('#modal-title');
const modalDescription = document.querySelector('#modal-description');
const modalFeatures = document.querySelector('#modal-features');
const modalContact = document.querySelector('#modal-contact');
const productDetails = document.querySelectorAll('.product-details');
let lastFocusedElement = null;

function closeProductModal() {
  if (!productModal) return;
  productModal.classList.remove('is-open');
  productModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  lastFocusedElement?.focus();
}

function openProductModal(productId, trigger) {
  const product = productData[productId];
  if (!productModal || !product) return;
  lastFocusedElement = trigger;
  modalImage.src = product.image;
  modalImage.alt = product.alt;
  modalKicker.innerHTML = `<span class="eyebrow__dot"></span> ${product.kicker}`;
  modalTitle.textContent = product.title;
  modalDescription.textContent = product.description;
  modalFeatures.innerHTML = product.features.map((feature) => `<li>${feature}</li>`).join('');
  productModal.classList.add('is-open');
  productModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  productModal.querySelector('.product-modal__close')?.focus();
}

productDetails.forEach((button) => {
  button.addEventListener('click', () => openProductModal(button.dataset.product, button));
});
productModal?.querySelectorAll('[data-modal-close]').forEach((element) => element.addEventListener('click', closeProductModal));
modalContact?.addEventListener('click', closeProductModal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && productModal?.classList.contains('is-open')) closeProductModal();
});
