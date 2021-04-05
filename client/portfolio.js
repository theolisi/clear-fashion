// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

// current products on the page
let currentProducts = [];
let currentPagination = {};
let filtered_products = [];
let brand_filter = x => true;
let reasonable_filter = x => true;
let recent_filter = x => true;


// inititiate selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const sectionProducts = document.querySelector('#products');
const spanNbProducts = document.querySelector('#nbProducts');
const spanNbNewProducts = document.querySelector('#nbNewProducts');
const selectBrand = document.querySelector('#brand-select');
const selectSort = document.querySelector('#sort-select');
const recentlyReleased = document.querySelector('#recently-released');
const reasonablePrice = document.querySelector('#reasonable-price');
const spanP50 = document.querySelector('#p50');
const spanP90 = document.querySelector('#p90');
const spanP95 = document.querySelector('#p95');
const spanLastRelease = document.querySelector('#last-release');


// Update brands choice

function update_brands_name(){
  let old_value = selectBrand.value
  selectBrand.innerHTML = '<option>all</option>';
  
  const brands_name = [];
  let my_option;
  currentProducts.forEach(article =>{
    if(!brands_name.includes(article.brand)){
      brands_name.push(article.brand)
      my_option = document.createElement('option');
      my_option.innerHTML = article.brand;
      selectBrand.appendChild(my_option);
    }
  })
  selectBrand.value = brands_name.includes(old_value)? old_value:'all';
}

const apply_all_filters = (products) =>{
  let filter = [brand_filter, reasonable_filter, recent_filter]
  filter.forEach(f =>{
    products = products.filter(f)
  })
  return products
}

/**
 * Set global value
 * @param {Array} result - products to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentProducts = ({result, meta}) => {
  currentProducts = result;
  currentPagination = meta;
  update_brands_name();
  filtered_products = apply_all_filters(currentProducts)
};

/**
 * Fetch products from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchProducts = async (page = 1, size = 12) => {
  try {
    const response = await fetch(
      `https://api-clearfashion.vercel.app/products/?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentProducts, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentProducts, currentPagination};
  }
};

/**
 * Render list of products
 * @param  {Array} products
 */
const renderProducts = products => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = products
    .map(product => {
    
      let url = product.photo.includes('https:')? product.photo:'https:'+product.photo;
      return `
      <div class="product">
        <span>${product.brand.charAt(0).toUpperCase() + product.brand.slice(1)}</span>
        <a href="${product.link}">${product.name}</a>
        <span>${product.price}€</span>
        <img class='imgPrdt' src=${url}>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionProducts.innerHTML = '<span class="title-pattern">Products</span>';
  sectionProducts.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */

const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */

 const compute_pk = k =>{
   let tab = [...filtered_products].sort((a, b) => sort_price(a, b, 1));
   let index = Math.trunc(k/100 * tab.length)
   return tab[index].price
 }

const renderIndicators = pagination => {
  if(filtered_products.length>0){
    spanP50.innerHTML = compute_pk(50)+'€';
    spanP90.innerHTML = compute_pk(90)+'€';
    spanP95.innerHTML = compute_pk(95)+'€';
    spanLastRelease.innerHTML = [...filtered_products].sort((a, b) => sort_date(a, b, -1))[0].released;
    spanNbNewProducts.innerHTML = filtered_products.reduce((total, x) => total+(Math.trunc((Date.now() - Date.parse(x.released)) / (1000 * 3600 * 24)) < 2*7?1:0), 0);
    spanNbProducts.innerHTML = filtered_products.length;
  }
  else{
    spanP50.innerHTML = 0
    spanP90.innerHTML = 0
    spanP95.innerHTML = 0
    spanLastRelease.innerHTML = '----'
    spanNbNewProducts.innerHTML = 0
    spanNbProducts.innerHTML = 0
  }
  
};

const render = (products, pagination) => {
  renderProducts(products);
  renderPagination(pagination);
  renderIndicators(pagination);
};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of products to display
 * @type {[type]}
 */
selectShow.addEventListener('change', event => {
  fetchProducts(currentPagination.currentPage, parseInt(event.target.value))
    .then(setCurrentProducts)
    .then(() => render(filtered_products, currentPagination));
});

// Feature 1 Browse pages

selectPage.addEventListener('change', event => {
  fetchProducts(parseInt(event.target.value), currentPagination.pageSize)
    .then(setCurrentProducts)
    .then(() => render(filtered_products, currentPagination));
});

// Feature 2 brand selection

selectBrand.addEventListener('change', event => {
  brand_filter = x =>{return event.target.value=='all'? true:x.brand == event.target.value}
  filtered_products = apply_all_filters(currentProducts)
  render(filtered_products, currentPagination);
});

// Feature 3 date selection

recentlyReleased.addEventListener('change', function(){

  if(this.checked){
    recent_filter = x => {return  Math.trunc((Date.now() - Date.parse(x.released)) / (1000 * 3600 * 24)) < 2*7}
  }
  else{
    recent_filter = x => true
  }
  filtered_products = apply_all_filters(currentProducts)
  render(filtered_products, currentPagination);
});

// Feature 4 price selection

reasonablePrice.addEventListener('change', function(){

  if(this.checked){
    reasonable_filter = x => {return x.price <= 50};
  }
  else{
    reasonable_filter = x => true;
  }
  filtered_products = apply_all_filters(currentProducts)
  render(filtered_products, currentPagination);
});

// Feature 5-6 price selection

function sort_price(a, b, order){
  return (a.price > b.price) ? order : ((b.price > a.price) ? -order : 0);
}

function sort_date(a, b, order){
  a = Date.parse(a.released);
  b = Date.parse(b.released);
  return (a > b) ? order : ((b > a) ? -order : 0);
}

selectSort.addEventListener('change', event=>{

  switch(event.target.value){
    case 'price-desc':
      currentProducts = [...currentProducts].sort((a, b) => sort_price(a, b, -1));
      break;
    case 'price-asc':
      currentProducts = [...currentProducts].sort((a, b) => sort_price(a, b, 1));
      break;
    case 'date-desc':
      currentProducts = [...currentProducts].sort((a, b) => sort_date(a, b, 1));
      break;
    case 'date-asc':
      currentProducts = [...currentProducts].sort((a, b) => sort_date(a, b, -1));
      break;
  }

  filtered_products = apply_all_filters(currentProducts)
  render(filtered_products, currentPagination);
});


//---------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () =>
  fetchProducts()
    .then(setCurrentProducts)
    .then(() => render(filtered_products, currentPagination))
);