const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 5000;

// Session setup
app.use(session({
  secret: 'diabreg_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Подесување за прикачени фајлови
const upload = multer({ storage: multer.memoryStorage() });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Служи јавни фајлови освен contact.html
app.use(express.static('public', {
  index: 'login.html'
}));

// Middleware за заштита
function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

// Email конфигурација
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'diab.reg.software@gmail.com',
    pass: 'wnyk tmfd ulvd cvct'
  }
});

// Рута за најава
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'Doc_diab' && password === 'PassDoc123') {
    req.session.loggedIn = true;
    res.redirect('/contact.html');
  } else {
    res.send(`
      <html>
        <head><meta charset="UTF-8"><title>Неуспешна најава</title></head>
        <body style="font-family:sans-serif; text-align:center; margin-top:100px;">
          <h2 style="color:red;">❌ Неточни податоци за најава</h2>
          <p>Ќе бидете вратени назад за 5 секунди...</p>
          <script>setTimeout(() => { window.location.href = "/login.html"; }, 5000);</script>
        </body>
      </html>
    `);
  }
});

// Заштитена форма
app.get('/contact.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/contact.html'));
});

// Испраќање е-пошта
app.post('/send-email', requireLogin, upload.array('attachments'), async (req, res) => {
  const { to, subject, message } = req.body;

  const attachments = req.files.map(file => ({
    filename: file.originalname,
    content: file.buffer
  }));

  const mailOptions = {
    from: '"DiabReg" <diab-reg.software/mk>',
    to: to,
    subject: subject,
    html: `<p>${message}</p>`,
    attachments: attachments
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send(`
      <html>
        <head><meta charset="UTF-8"><title>Испратено</title>
        <script>setTimeout(() => { window.location.href = "/contact.html"; }, 10000);</script>
        </head>
        <body style="font-family:Arial; text-align:center; margin-top:100px;">
          <h2 style="color:green;">✅ Пораката со фајл е испратена успешно!</h2>
          <p>Ќе бидете пренасочени назад за 10 секунди...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send(`
      <html>
        <head><meta charset="UTF-8"><title>Грешка</title>
        <script>setTimeout(() => { window.location.href = "/contact.html"; }, 10000);</script>
        </head>
        <body style="font-family:Arial; text-align:center; margin-top:100px;">
          <h2 style="color:red;">❌ Грешка при испраќање на пораката.</h2>
          <p>Ќе бидете пренасочени назад за 10 секунди...</p>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Серверот работи на http://localhost:${PORT}`);
});
