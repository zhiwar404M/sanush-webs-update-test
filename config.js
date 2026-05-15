// ── SANARIA CONFIG ── edit this file to control the site ──

var SANARIA_CONFIG = {

  // ── MAINTENANCE MODE ── set true to show maintenance page ──
  maintenance: false,
  maintenanceMessage: 'ئێستا ئەم بەشە لە ژێر نوێکردنەوەدایە. بەم زووانە دووبارە دەگەڕێتەوە.',

  // ── SITE VERSION ── change this to trigger update dialog ──
  version: '2.0',

  // ── UPDATE NOTES ── list of changes shown in update dialog ──
  updateNotes: [
    'داخیلبوون بە Google و ئیمەیڵ زیاد کرا',
    'داتاکان ئۆتۆماتیک لە Cloud سەیڤ دەبێت',
    'بەشی Pro زیاد کرا',
    'سکرینی بارکردن زیاد کرا',
    'دیالۆگی نوێکردنەوە زیاد کرا',
  ],

  // ── GOOGLE SHEETS WEB APP URL ──
  // paste your deployed Google Apps Script URL here
  sheetsURL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',

  // ── FIREBASE CONFIG ──
  firebase: {
    apiKey:            "AIzaSyC7jIwGVdqIIOv53gFw83mP9Pa4PBSLg2I",
    authDomain:        "sanush-website-datebase.firebaseapp.com",
    projectId:         "sanush-website-datebase",
    storageBucket:     "sanush-website-datebase.firebasestorage.app",
    messagingSenderId: "336092110705",
    appId:             "1:336092110705:web:1b7b06b247ab1fae54e0d0"
  },

  // ── PRO FEATURES ──
  pro: {
    price: '$4.99',
    currency: 'USD',
    features: [
      'ئەکاونتی نامحدود',
      'هەناردەکردنی PDF و Excel',
      'ڕاپۆرتی پێشکەوتوو',
      'پشتیوانی تایبەت',
    ]
  }
};
