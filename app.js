const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "1shironnt5me",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "H07UPlpCPHCzN5JXCbd9n2-CipXgurSkjpJA0zVUKAc"
});
//console.log(client);

const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

//cart
let cart = [];
let buttonsDOM = [];

//////////////////////////getting the products//////////////////////////////
class Products {
  async getProducts() {
    try {
      let contentful = await client.getEntries({
        content_type:"comfyHouseProducts"
      });
      //console.log(contentful);
        

      //let result = await fetch("products.json");
      //let data = await result.json(); // the date will be this wierd obj with bunch of other objs inside of it. so in order to get them easier, we do a bit of destructuring.
      //let products = data.items;
      let products = contentful.items;
      products = products.map((item) => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;

        return { title, price, id, image };
      });

      return products;
    } catch (error) {
      console.log(error);
    }
  }
}
/////////////////////////////////display products////////////////////////////////
class UI {
  displayproducts(products) {
    let result = "";
    products.forEach((product) => {
      result += `
            <!--single product-->
            <article class="product">
                <div class="img-container">
                    <img src=${product.image}>
                    <button class="bag-btn" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i>
                        add to cart
                    </button>
                </div>
                <h3>${product.title}</h3>
                <h4>$${product.price}</h4>
            </article>
            <!--end of single product-->
            `;
    });
    productsDOM.innerHTML = result;
  }

  getBagBtns() {
    //turning the node list into an array with the spread operator. we could also use the node list, but this would be easier.
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttonsDOM = buttons;
    buttons.forEach( button => {
      let id = button.dataset.id;
      let inCart = cart.find( item => (item.id === id));
      if (inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      }
      button.addEventListener("click", (event) => {
        event.target.innerText = "In Cart";
        event.target.disabled = true;

        //get product from products
        let cartItem = { ...Storage.getProduct(id), amount: 1 };

        //add product to the cart
        cart = [...cart, cartItem];

        //save cart in the local storage
        Storage.saveCart(cart);

        //set cart values
        this.setCartValues(cart);

        //display cart items(add item to the DOM)
        this.addCartItem(cartItem);

        //show the cart
        this.showCart();
      });
    });
  }
               //------------------------------//

  setCartValues(cart) {
    let tempTotal = 0;
    let itemTotal = 0;

    cart.map((item) => {
      tempTotal += item.price * item.amount;
      itemTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemTotal;
    //console.log(cartTotal, cartItems);
  }

  addCartItem(item){
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
        <img src=${item.image} alt="product">
                    <div>
                        <h4>${item.title}</h4>
                        <h5>$${item.price}</h5>
                        <span class="remove-item" data-id=${item.id}>remove</span>
                    </div>
                    <div>
                        <i class="fas fa-chevron-up" data-id=${item.id}></i>
                        <p class="item-amount">${item.amount}</p>
                        <i class="fas fa-chevron-down" data-id=${item.id}></i>
                    </div>
    `;

    cartContent.appendChild(div);
    //console.log(cartContent);
  }

  showCart(){
    cartDOM.classList.add('showCart');
    cartOverlay.classList.add('transparentBcg');
  }

  setupAPP(){
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartBtn.addEventListener('click', this.showCart);
    closeCartBtn.addEventListener('click', this.hideCart);
  }

  populateCart(cart){
      cart.forEach(item => this.addCartItem(item));
  }

  hideCart(){
      cartDOM.classList.remove('showCart');
      cartOverlay.classList.remove('transparentBcg');
  }

                //------------------------------//


  cartLogic(){

    //clear cart button
    clearCartartBtn.addEventListener('click', ()=>{       //this is very important: if we directly have put the clearCart as the callback without arrow function, this keyword would only refer to the button, not class UI methods. the reason it worked for showCart is that we were only accessing DOM elements, not any of the methods of UI class.
        this.clearCart();
    });
    //cart functionality
    cartContent.addEventListener('click',event =>{
      if (event.target.classList.contains('remove-item')){
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        //remove item from DOM
        cartContent.removeChild(removeItem.parentElement.parentElement);
        //remove item from the storage
        this.removeItem(id);

      } else if (event.target.classList.contains('fa-chevron-up')){
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        //update the amount in the storage
        tempItem.amount = tempItem.amount + 1;
        //save the item in the cart
        Storage.saveCart(cart);
        //update the price values in the cart
        this.setCartValues(cart);
        //update the amount in the DOM
        addAmount.nextElementSibling.innerText = tempItem.amount;

      } else if (event.target.classList.contains('fa-chevron-down')){
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        //update the amount in the storage
        tempItem.amount = tempItem.amount - 1;

        if(tempItem.amount>0){
          //save the item in the cart
          Storage.saveCart(cart);
          //update the price values in the cart
          this.setCartValues(cart);
          //update the amount in the DOM
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        }else{
          //remove item from DOM
          cartContent.removeChild(lowerAmount.parentElement.parentElement);
          //remove item from the storage
          this.removeItem(id);
        }

      }
    });
  }

  clearCart(){
    let cartItems = cart.map(item => item.id);
    //console.log(cartItems);
    cartItems.forEach(id => this.removeItem(id));

    while(cartContent.children.length > 0){
        cartContent.removeChild(cartContent.children[0]);
    }

    this.hideCart();
  }

  removeItem(id){
    cart = cart.filter(item => item.id !==id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleBtn(id);
    button.disabled = false;
    button.innerHTML = `
    <i class="fas fa-shopping-cart"></i> add to cart
    `;
  }

  getSingleBtn(id){
    return buttonsDOM.find(button => button.dataset.id === id);
  }
}

//////////////////local storage///////////////////////////////////////
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products)); //when you use a static method, you will be able to use it in another class
  }

  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find((product) => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  static getCart(){
      return localStorage.getItem('cart')? JSON.parse(localStorage.getItem('cart')):[];
  }
}


//////////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Products();
    //setup app
    ui.setupAPP();

  //getting the products
  products
    .getProducts()
    .then((products) => {
      ui.displayproducts(products);
      //because it is a static method, we dont need to create an instant for it first.
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagBtns();
      ui.cartLogic();
    });
});

//we are going to save the products in the cart in th local storage. this way if we refresh the page, they will still be there.
//we should technically get each product from the server when we want to save them, but since we have only 8 products here, we are going to save them in the local storage to speed things up.

/*
for adding an event to the buttons, we cant just choose them with querySelectorAll, because it returns a node list and because this is a synchronous action, while items were added asynchronously.
 we have some option here: pass a callback function to the forEach method of the products, but we can use the facts that we have .then s and keep adding to it.
 this way we can make sure that we only can do it after we get the products.

*/

//side note: we cant load the data now without the dev server, directly from the file. but later, when we use netlify, we will be able to do so.


//for setting the remove and increase/decrease btn, apart from event bubbling, we could add a callback function once the item is added to the basket.



//contentfull: a headless CMS or a BYOFE(bring youe own front end).it has a nice graphical interface, where we can add our own data and then we can consume it in whatever application we like.
