const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./correcttask-firebase-adminsdk-y5tch-4cb2e7afe4.json');
const session = require('express-session');
const cookieParser = require('cookie-parser')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const porta = 8080;

app.use(cors({
  origin:'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: 'seuSegredoSuperSecreto',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60,
    },
  })
);

const RotaDesario = require('./Desafios');
const RotaContas = require('./Contas');

// AQUI HAS AS ROTAS 
app.use('/desafios', RotaDesario);
app.use('/contas', RotaContas);

app.listen(porta, () => {
  console.log(`Diretamente de nárnia: ${porta}`);
});
