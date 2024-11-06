const express=require('express');
const app=express();
const path=require('path')
const Cart=require("./model/order")
var session = require('express-session')
const passport=require('passport')
const localstrategy= require('passport-local').Strategy;
const User=require("./model/user")
const NewOrder=require("./model/order")
const ExpressError=require("./ExpressError")
var flash = require('connect-flash');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const { error } = require('console');
const { wrap } = require('module');
let store=MongoStore.create({
    secret:'abhay',
    mongoUrl: process.env.MONGOURL,
    touchAfter:36*2400
})
app.set('view engine', 'ejs');
engine = require('ejs-mate'),
app.use(express.urlencoded({ extended: true })); // Add this line for JSON body parsing
app.use(session({
    secret: 'your-secret-key', // Replace with a secure key for production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false,maxAge:12*24*3600 } // Set `secure: true` only if using HTTPS
}));
app.use(passport.initialize());

app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.session())
passport.use(new localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser());

app.use(flash())
// use ejs-locals for all ejs templates:
app.engine('ejs', engine);
// Set the views directory
app.set('views', path.join(__dirname, 'views'));
app.listen(8080,()=>{
    console.log('app is listening')
})
async function Data(id) {
    let data=await fetch(`https://fakestoreapi.com/products/${id}`);
    data= await data.json();
    return data;
}
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.use((req,res,next)=>{
res.locals.flashmsg= req.flash('info')
res.locals.errmsg=req.flash('errmsg')
next()
})

app.use((req,res,next)=>{
    res.locals.users=req.user
    next()
})
function WrapAsync(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch((err) => {
            let { status = 500, message = "something went wrong" } = err;

            return next(new ExpressError(status, message))
        })
    }

}
app.get("/",(req,res)=>{
res.redirect("/home")
})
app.get("/register",async(req,res)=>{
   res.render("pages/register.ejs")
})
app.post("/register",WrapAsync(async(req,res)=>{
    let {email,Username,password}=req.body;
    let newuser=new User({email:email,username:Username})
    let registeruser=await User.register(newuser,password)
    req.flash('info', 'User registered successfully!')

    res.redirect("/login")
}))
app.get("/login",(req,res)=>{
    res.render("pages/login.ejs")
})
app.post("/login",passport.authenticate("local",{failureRedirect:"/login",failureFlash:true}),(req,res)=>{
    let {username,password}=req.body;
    req.flash('info', 'User logged in!')
    

    
    res.redirect('/home')

    // res.send(res.locals.user)
})
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).send('Logout failed');
        }
    req.flash('info', 'User logged out!')

        res.redirect('/login'); // Redirect to the login page after logout
    });
});

app.get("/home",isAuthenticated,WrapAsync(async(req,res)=>{
    let {category}=req.query;
    console.log(category)
    let data;
    if(category){
        const encodedQueryValue = encodeURIComponent(category);
         data=await fetch(`https://fakestoreapi.com/products/category/${encodedQueryValue}`);
    }else{
        data=await fetch('https://fakestoreapi.com/products');
        
    }
    data= await data.json();
console.log(data)
    
        res.render('pages/home.ejs',{data})
  
}))
app.get("/detail/:id",isAuthenticated,WrapAsync(async(req,res)=>{
    let {id}=req.params;
let data=await fetch(`https://fakestoreapi.com/products/${id}`);
    data= await data.json();
//   res.send(data)
    res.render('pages/viewdetail.ejs',{data})
}))

app.get("/viewcart",isAuthenticated,WrapAsync(async(req,res)=>{
    try{
        if(req.session.cart){
            let data=[]
            for(let i=0;i<req.session.cart.items.length;i++){
                let res=await fetch(`https://fakestoreapi.com/products/${req.session.cart.items[i].productId}`);
        res= await res.json();
                data.push(res)
            }
            console.log('total='+req.session.cart.total)
            res.render("pages/cart.ejs",{data,total:req.session.cart.total})
        }else{
 req.flash('info', 'Cart is empty !')

            res.redirect('/home')
        }
    }catch(err){
        throw new expressError(err);
    }
   
}))
app.post("/addtocart",isAuthenticated,WrapAsync(async(req,res)=>{
 let {productId, quantity, price}=req.query;
 if(!req.session.cart){
   
    
    req.session.cart={items:[],total:0};
    
 }
 let cart=req.session.cart;
 let item=cart.items.find(item=>
    item.productId===productId
 )
 if(item){
    item.quantity=parseInt(item.quantity, 10)+1;
 cart.total=cart.items.reduce((sum,item)=>sum+Number(item.price)*Number(item.quantity),0);
   
   
 }else{
    cart.items.push({productId,quantity,price})
    cart.total=cart.total+Number(price);

 }
 req.flash('info', 'item added to cart!')

 res.redirect('/viewcart')
 
}))
app.get("/removefromcart/:id",isAuthenticated,WrapAsync(async(req,res)=>{
let {id}=req.params;
let ind=0;

    for(let i=0;i<req.session.cart.items.length;i++){
        if(req.session.cart.items[i].productId==id){
            ind=i;
        }
    }
req.session.cart.total=req.session.cart.total-(Number(req.session.cart.items[ind].price)*Number(req.session.cart.items[ind].quantity))
req.session.cart.items.splice(ind,1);
if(req.session.cart.total==0){
    req.session.cart=null;
}
req.flash('info', 'item removed!')

res.redirect('/viewcart')
}))
app.get("/checkout",isAuthenticated,(req,res)=>{
    
    res.render("pages/checkoutpage.ejs")
})
app.get("/myorders",isAuthenticated,WrapAsync(async(req,res)=>{
    let carts=await Cart.find({owner:req.user._id})
    // console.log(items)
    // res.render("pages/myorder.ejs",{carts})
    req.flash('info','this function is under development stage')
    res.redirect("/home")
}))
app.get("/process-payment",isAuthenticated,WrapAsync(async(req,res)=>{
   setTimeout(async()=>{const isPaymentSuccessful = Math.random() > 0.2; // Simulated success rate

    if (isPaymentSuccessful) {
        let customerorder=new NewOrder({items:req.session.cart.items,total:req.session.cart.total,owner:req.user._id})
        let result=await customerorder.save();
        req.session.cart = null;
    
        req.flash('info', 'Order Placed Successfully!')

        res.redirect("/myorders")
    } else {
        res.send('<h1>Payment Failed</h1><p>Please try again.</p>');
    }},3000)
    
    
})
)


app.use((req,res)=>{
   throw new ExpressError(404,"page not found")
})

app.use((err,req,res,next)=>{
    req.flash('errmsg',err.message)
    res.redirect("/home")
    
})