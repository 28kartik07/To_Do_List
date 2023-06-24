const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://kartik:kartik123@cluster0.8ou8ajo.mongodb.net/?retryWrites=true&w=majority").then(()=>console.log("mongo connected")).catch(err => console.log(err));

const express = require("express");
const bodyparser = require("body-parser");
const _ = require("lodash");

const app = express();    
app.use(bodyparser.urlencoded({extended: true})); 
app.use(express.static("public"));

app.set('view engine','ejs');

//////// main list item schema ///////////////////////
const itemschema =  new mongoose.Schema({
    name : String
});

const itemmodel = mongoose.model("taskitems",itemschema);

const item1 = new itemmodel({
    name : "Eat"
});
const item2 = new itemmodel({
    name : "Workout"
});
const item3 = new itemmodel({
    name : "Sleep"
});

const defaultitems = [item1,item2,item3];

////////subitem list ///////////////////////////
const subitemscheama = new mongoose.Schema({
    name : String,
    subi : [itemschema]
});

const subitemmodel = mongoose.model("subitems",subitemscheama);


var today = new Date();
var options = {
    weekday : "long",
    day : "numeric",
    month : "long"  
};
var day = today.toLocaleDateString("en-US",options);

app.get("/",function(req,res){

    itemmodel.find().then((results)=>{
        if(results.length === 0)
        {
            itemmodel.insertMany(defaultitems).catch(function(err){
                console.log(err);
            });
        }
        else
        {
            res.render("list",{todaysday: day , newtask: results});
        }
        
    }).catch((err)=>{ 
        if(err)
            console.log(err);
    });
    
});

app.post("/",function(req,res){ 
    var task = req.body.todotask;
    var listname = req.body.submit;
    const item4 = new itemmodel({
        name : task
    });
    if(listname === day)
    {
        item4.save();
        res.redirect("/") ;
    }
    else
    {
        subitemmodel.findOne({name : listname}).then((result)=>{
            result.subi.push(item4);
            result.save();
            res.redirect("/"+listname);     
        });
    }
    
});

app.post("/delete",function(req,res){
    var check = req.body.checkitem;
    var listname = req.body.listname;
    if(listname === day)
    {
        itemmodel.findByIdAndRemove(check).catch((err)=>{
            if(err)
                console.log(err);
        });
        res.redirect("/");
    }
    else
    {
        subitemmodel.findOneAndUpdate(
        { name: listname },                          
        { $pull: { subi: { _id: check } } }            
        )
        .then(() => {
            res.redirect("/" + listname);            
        })
        .catch(err => {
            console.error(err);
        });
        
    }
        
});

app.get("/:newpage",function(req,res){
    const a = _.capitalize(req.params.newpage);
    subitemmodel.findOne({name : a}).then((results)=>{
        if(!results)
        {
            const subitem = new subitemmodel({
                name : a,
                subi : defaultitems
            });
            subitem.save();
            res.redirect("/"+a);
        }
        else
        {   
            res.render("list",{todaysday : results.name , newtask : results.subi});
        }
      
    }).catch((err)=>{
        console.log(err);
    }); 

});
app.listen(3000,function(){
    console.log("server started");
});