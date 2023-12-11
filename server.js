const express = require('express'); // express 모듈을 상수 express에 저장
const app = express();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/profile-images', express.static('C:/Private_Folder'));


const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const { MongoClient, ObjectId } = require('mongodb');

const sha = require('sha256');

let cookieParser = require('cookie-parser');

app.use(cookieParser());


let session = require('express-session');
app.use(session({
   secret: '123jslsdkj23',
   saveUninitialized: true,
}));

const url = 'mongodb+srv://student:1234qwer@mydbforweb.ibitn9o.mongodb.net/?retryWrites=true&w=majority';
const ObjId = require('mongodb').ObjectId;
let mydb;


MongoClient.connect(url)
    .then((client) => {
        mydb = client.db('myboard');
        mydb.collection('account').find().toArray().then(result=>{
         console.log(result);
        })
        app.listen(8080, function(){
            console.log("포트 8080으로 서버 대기 중...");
        });
    })
    .catch((err) => {
        console.log(err);
    });

app.get('/', (req, res)=>{
    res.render('login.ejs');
});

app.get('/blog', function(req, res){
    mydb
    .collection('post')
    .find()
    .toArray()
    .then((result) => {
       console.log(result);
       res.render('blog.ejs', { data: result });
    });
});

app.get('/login', function(req, res){
    console.log(req.session);
   if(req.session.user){
      console.log("세션 유지");
      mydb
        .collection('post')
        .find()
        .toArray()
        .then((result) => {
         console.log(result);
        res.render('blog.ejs', { data: result });
    });
   }
   else{
      res.render('login.ejs');
   }
});

app.get('/write', function(req, res){
    res.render('write.ejs');
});

app.get('/idlist', function(req, res){
    mydb.collection('account').find().toArray().then(result=>{
    console.log(result);
    res.render('idlist.ejs', { user: result});
    });
});



app.get('/profile', function(req, res) {
    // 현재 프로필 사진 파일 이름을 읽어와서 전달
    const currentProfilePic = 'me.jpg'; // 현재 프로필 사진 파일 이름 가져오기
    res.render('profile.ejs', { profilePic: currentProfilePic });
});
app.get('/profile-images/:filename', function(req, res) {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, 'C:/Private_Folder', filename);

    // 이전에 캐시된 이미지를 무시하도록 헤더 추가
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', 0);

    res.sendFile(imagePath);
});



app.get('/signup', function(req, res){
    res.render('signup.ejs');
});

app.post('/login', function(req, res){
    console.log("아이디: " + req.body.userid);
    console.log("비밀번호: " + req.body.userpw);
 
    mydb.collection("account").findOne({userid: req.body.userid}).then(result=>{
        if(result.userpw == req.body.userpw){
            req.session.user = req.body;
            console.log("첫 로그인 성공");
            res.redirect("/blog"); // 로그인 성공 시 /blog로 리다이렉션
        } else {
            res.send('<script>alert("아이디가 일치하지 않습니다."); window.location="/login";</script>');
            console.log("로그인 실패");
        }
    });
 });

 app.post('/signup',function(req,res){
    mydb.collection('account').insertOne(
        {userid: req.body.userid, userpw: req.body.userpw}).then(result=>{
        console.log(result);
        console.log('회원가입 성공');
    });
    res.redirect("/login");
 })

 const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'C:/Private_Folder'); // 파일이 저장될 폴더 경로
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'me-' + uniqueSuffix + '.jpg'); // 고유한 파일 이름 생성
    }
});

const upload = multer({ storage: storage });

app.post('/update-profile', upload.single('new-profile-pic'), function(req, res) {
    // 업로드가 완료된 후에는 현재 프로필 사진 파일 이름을 읽어와서 전달
    res.redirect('/profile');
});


app.post('/write',function(req,res){
    console.log(req.body.title);
    console.log(req.body.content);
    let now = new Date();
    mydb.collection('post').insertOne(
        {title:req.body.title, content: req.body.content, date: now.getTime()}).then(result=>{
        console.log(result);
        console.log('데이터 추가 성공');
    })
    .catch(err=>{
       console.log(err);
       console.log("데이터 추가 실패");
    });
    res.redirect('/blog');
});

app.post("/delete", function(req, res){
    try {
        req.body._id = new ObjId(req.body._id);
        mydb.collection('post').deleteOne(req.body).then(result=>{
            console.log("삭제 완료");
            res.status(200).send();
        });
    } catch (error) {
        console.error("ObjectId 생성 오류:", error);
        res.status(500).send("Internal Server Error");
    }
 });

 app.get('/content/:id', function(req, res){
    console.log(req.params.id);
    let new_id = new ObjId(req.params.id);
 
    mydb.collection("post").findOne({ _id: new_id}).then(result=>{
       console.log(result);
       res.render("content.ejs", {data: result});
    }).catch(err => {
       console.log(err);
       res.status(500).send();
    });
 });
 
 app.get('/edit/:id', function(req, res){
    console.log(req.params.id);
    let new_id = new ObjId(req.params.id);
 
    mydb.collection("post").findOne({ _id: new_id}).then(result=>{
       console.log(result);
       res.render("edit.ejs", {data: result});
    }).catch(err => {
       console.log(err);
       res.status(500).send();
    });
 });
 
 app.post('/edit',function(req,res){
    console.log(req.body.title);
    console.log(req.body.content);
    let new_id = new ObjId(req.body.id);
 
    mydb.collection('post').updateOne({_id: new_id }, 
       {$set: {title: req.body.title, content: req.body.content}}).then(result=>{
       console.log('데이터 수정 성공');
       res.redirect('/blog');
    });
 })
