const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const config = require('./config.json');
const Product = require('./models/Product');
const Sale = require('./models/Sale');
const mongoose = require('mongoose');


const app  = express();
const PORT = 3000;


//* ضبط Express
app.use(express.json({limit : '10mb'}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


//? اتصال بقاعدة البيانات MongoDB
mongoose.connect('mongodb+srv://Daster:Ali12345@mhsbt.glgwf98.mongodb.net/?retryWrites=true&w=majority&appName=mhsbt', {
}).then(() => {
  console.log("✅ database connected successfully");
}).catch((err) => {
  console.error("❌ database connected error:", err);
});






//! project functions
//* ضبط اللغة العربية
function reverseArabic(text) {
  return text.split(' ').reverse().join(' ');
}
//* توليد معرف فريد للمنتجات والمبيعات
function generateId() { return Date.now().toString(); }

//* ضبط اسم المشروع والصورة
app.locals.projectName = config.projectName;
app.locals.projectIMG = config.projectIMG

//*لحفظ التعديلات في github
/*
!  git add .
!  git commit -m "تعديل جديد"
!  git push origin master
*/







//! توجيه للمنتجات كصفحة رئيسية
app.get('/', (req, res) => res.redirect('/products'));

//! 1) شاشة الجرد والإضافة والبيع السريع
app.get('/products', async (req, res, next) => {
  try {
    const category = req.query.category || null;
    const filter   = category ? { category } : {};
    let products = await Product.find(filter).lean().sort({ qty: 1 });
    const categories = [...new Set(products.map(p => p.category))];
    res.render('products', {
      products,
      categories,
      category,
      activePage: 'products'
    });
  } catch (err) {
    next(err);
  }
});

app.post('/products/delete/:id', async (req, res, next) => {
  try {
    await Product.deleteOne({ id: req.params.id });
    res.redirect('/products');
  } catch (err) {
    next(err);
  }
});




app.post('/products/add', async (req, res, next) => {
  try {
    const {
      name,
      category,
      priceIn,
      priceOut,
      qty,
      expiryDate,
      barcode,
      imgPath
    } = req.body;

	

    let product = await Product.findOne({ name, category });

    if (product) {
      product.qty += +qty;
      if (priceIn)        product.priceIn    = +priceIn;
      if (priceOut)       product.priceOut   = +priceOut;
      if (expiryDate)     product.expiryDate = expiryDate;
      if (imageUrl)       product.imgPath    = imageUrl;

      await product.save();
    } else {
      product = new Product({
        id:         generateId(),
        name,
        category,
        priceIn:    +priceIn,
        priceOut:   +priceOut,
        qty:        +qty,
        expiryDate,
        imgPath, // رابط مباشر للصورة
        lastSold:   null,
        barcode
      });
      await product.save();
    }

    res.redirect('/products');
  } catch (err) {
    next(err);
  }
});








//? 2) عملية البيع السريع
app.post('/sales/quick', async (req, res, next) => {
  try {
    const { productId } = req.body;
    const prod = await Product.findOne({ id: productId });

    if (!prod) {
      return res.status(404).json({ success: false, message: 'منتج غير موجود' });
    }
    if (prod.qty <= 0) {
      return res.json({ success: false, message: '❌ المنتج غير متوفر حالياً' });
    }
   
    prod.qty     -= 1;
    prod.lastSold = new Date();
   if (prod.qty < 0) {
     prod.qty = 0;
   }

   await prod.save();


    const saleCount = await Sale.countDocuments();
    const saleId    = (saleCount + 1).toString();
    const sale = new Sale({
      id:            saleId,
      date:          new Date(),
      items: [{
        productId:  prod.id,
        name:       prod.name,
        qty:        1,
        priceOut:   prod.priceOut,
        priceIn:    prod.priceIn
      }],
      paymentMethod: 'Cash',
      orderNo:        saleId
    });
    await sale.save();

    res.json({
      success: true,
      message: '✅ تمت عملية البيع بنجاح',
      receipt: `/receipt/${saleId}`
    });
  } catch (err) {
    next(err);
  }
});




app.post('/products/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await Product.updateOne({ id }, updates);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});





//! 2) توليد img لوصل البيع
const { createCanvas, loadImage, registerFont } = require('canvas');

registerFont(path.join(__dirname, 'public', 'fonts', 'Cairo-Regular.ttf'), {
  family: 'Cairo-Regular'
});

app.get('/receipt/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findOne({ id: req.params.id }).lean();
    if (!sale) {
      return res.status(404).send('وصل غير موجود');
    }

    const canvas = createCanvas(500, 700);
    const ctx    = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font      = '18px Cairo-Regular';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'right';
    ctx.direction = 'rtl';

    let y = 40;

    ctx.font = '24px Cairo-Regular';
    ctx.fillText(`🛍️ ${app.locals.projectName} - وصل بيع رسمي`, canvas.width - 20, y);
    y += 30;

    ctx.font = '16px Cairo-Regular';
    ctx.fillText(`📌 رقم الطلب: ${sale.orderNo}`, canvas.width - 20, y);        y += 25;
    ctx.fillText(
      `📆 التاريخ: ${new Date(sale.date).toLocaleString('ar-EG')}`,
      canvas.width - 20, y
    );                                                                            y += 25;
    ctx.fillText(`💳 طريقة الدفع: ${sale.paymentMethod}`, canvas.width - 20, y); y += 40;

    let total = 0;
    ctx.font = '16px Cairo-Regular';
    ctx.fillText('🧾 تفاصيل الطلب:', canvas.width - 20, y);
    y += 25;

    sale.items.forEach(item => {
      const line  = `${item.name} - ${item.qty} × ${item.priceOut} = ${item.qty * item.priceOut} دينار`;
      ctx.fillText(line, canvas.width - 20, y);
      total += item.qty * item.priceOut;
      y += 25;
    });

    y += 20;
    ctx.font = '18px Cairo-Regular';
    ctx.fillText(`💰 المجموع الكلي: ${total.toLocaleString()} دينار`, canvas.width - 20, y);
    y += 30;

    ctx.font = '14px Cairo-Regular';
    ctx.fillText('✨ شكرًا لتعاملكم معنا', canvas.width - 20, y);

    res.setHeader('Content-Type', 'image/png');
    canvas.pngStream().pipe(res);

  } catch (err) {
    next(err);
  }
});



//! 3) صفحة الإحصائيات
app.get('/stats', (req, res) => {
  res.render('stats', { activePage: 'stats' });
});

app.get('/stats-data', async (req, res, next) => {
  try {
    const data = await Sale.aggregate([
      { $unwind: '$items' },
      { 
        $group: {
          _id: { $ifNull: ['$items.name', 'غير معروف'] },
          totalQty: { $sum: '$items.qty' }
        }
      },
      { $sort: { totalQty: -1 } }
    ]);

    const labels = data.map(d => d._id);
    const values = data.map(d => d.totalQty);

    res.json({ labels, values });
  } catch (err) {
    next(err);
  }
});


//! 4) التنبيهات 
app.get('/notifications', async (req, res, next) => {
  try {
    // 1. حد الأيام الذي يعتبر بعدها المنتج راكد
    const limitDays = parseInt(req.query.limit, 10) || 14;
    const now        = new Date();
    const threshold  = new Date(now.getTime() - limitDays * 24 * 60 * 60 * 1000);

    const products = await Product.find().lean();
    const lowStock = products.filter(p => p.qty < 5);
    const inactive = products.filter(p => {
      return !p.lastSold 
          || new Date(p.lastSold) <= threshold;
    });

    const expired = products.filter(p => {
      return p.expiryDate 
          && new Date(p.expiryDate) < now;
    });

    res.render('notifications', {
      products,
      lowStock,
      inactive,
      expired,
      limitDays,
      activePage: 'notification'
    });
  } catch (err) {
    next(err);
  }
});



app.get('/notifications-count', async (req, res, next) => {
  try {
    const now        = new Date();
    const limitDays  = 14; // افتراضي – تقدر تخليه ديناميكي
    const threshold  = new Date(now.getTime() - limitDays * 24 * 60 * 60 * 1000);

    const products = await Product.find().lean();

    const lowStock = products.filter(p => p.qty < 5);
    const inactive = products.filter(p => !p.lastSold || new Date(p.lastSold) < threshold);
    const expired  = products.filter(p => p.expiryDate && new Date(p.expiryDate) < now);

    const total = lowStock.length + inactive.length + expired.length;

    res.json({ count: total });
  } catch (err) {
    next(err);
  }
});





//! 5) صفحة تقارير المبيعات الأسبوعية
app.get('/reports/week', async (req, res, next) => {
  try {
    const weekAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // جلب المبيعات من MongoDB بعد هذا التاريخ
    const weekSales = await Sale.find({ date: { $gte: weekAgo } }).lean();

    res.setHeader('Content-Type', 'application/pdf');
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.registerFont('arabic', path.join(__dirname, 'public', 'fonts', 'Cairo-Regular.ttf'));
    doc.font('arabic');
    doc.text(' ', { align: 'right' });

    doc
      .fontSize(18)
      .text(reverseArabic('📊 تقرير مبيعات الأسبوع'), { align: 'center' })
      .moveDown();

    weekSales.forEach(s => {
      doc
        .fontSize(12)
        .text(reverseArabic(`رقم الطلب: ${s.orderNo}`), { align: 'right' })
        .text(reverseArabic(`تاريخ: ${new Date(s.date).toLocaleString('ar-EG')}`), { align: 'right' });

      s.items.forEach(item => {
        const line = `${item.name} – ${item.qty} × ${item.priceOut} = ${item.qty * item.priceOut} دينار`;
        doc.text(reverseArabic(line), { align: 'right' });
      });

      doc.moveDown();
    });

    const totalProfit = weekSales.reduce((acc, sale) => {
      return acc + sale.items.reduce((sum, item) => sum + (item.priceOut * item.qty), 0);
    }, 0);

    doc
      .fontSize(14)
      .text(
        reverseArabic(`💰 إجمالي المبيعات لهذا الأسبوع: ${totalProfit.toLocaleString()} دينار`),
        { align: 'right' }
      );

    doc.end();
  } catch (err) {
    next(err);
  }
});

//! 5) صفحة الربحية – profit
app.get('/profit', async (req, res, next) => {
  try {
    const [products, sales] = await Promise.all([
      Product.find().lean(),
      Sale.find().lean()
    ]);

    const totalBuy = products.reduce((acc, p) => {
      return acc + (p.priceIn || 0) * (p.qty || 0);
    }, 0);

    const totalSell = sales.reduce((acc, sale) => {
      return acc + sale.items.reduce((sum, item) => {
        return sum + (item.priceOut || 0) * (item.qty || 0);
      }, 0);
    }, 0);

    const profit = totalSell - totalBuy;

    const profitByDay = {};
    sales.forEach(sale => {
      const date = new Date(sale.date);
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;

      const dailyProfit = sale.items.reduce((sum, item) => {
        const inP  = item.priceIn  || 0;
        const outP = item.priceOut || 0;
        const qty  = item.qty      || 0;
        return sum + (outP - inP) * qty;
      }, 0);

      profitByDay[dateStr] = (profitByDay[dateStr] || 0) + dailyProfit;
    });

    const profitDates  = Object.keys(profitByDay);
    const profitValues = Object.values(profitByDay);

    res.render('profit', {
      totalBuy,
      totalSell,
      profit,
      profitDates,
      profitValues,
      activePage: 'profit'
    });

  } catch (err) {
    next(err);
  }
});

//! 6) صفحة المساعدة
app.get('/help', (req, res) => {
  res.render('help', { activePage: 'help' });
});

app.post('/return-product', async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findOne({ id: productId});

    if (!product) return res.status(404).send('المنتج غير موجود');

    // تعديل الكمية (مثلاً زيادة 1)
    product.qty += 1;
    await product.save();

	

    res.redirect('/products');
  } catch (err) {
    console.error('خطأ في الإرجاع:', err);
    res.status(500).send('فشل في إرجاع المنتج');
  }
});








app.post('/cart/checkout', async (req, res) => {
  try {
	  
    const saleCount = await Sale.countDocuments();
    const saleId    = (saleCount + 1).toString();
    const { items } = req.body;

    const saleItems = [];
    let saleTotal = 0;

    for (const item of items) {
      const prod = await Product.findOne({ id: item.id });
      if (prod && prod.qty > 0) {
        prod.qty -= 1;
        prod.lastSold = new Date();
        await prod.save();

        saleItems.push({
          productId: prod.id,
          name: prod.name,
          qty: 1,
          priceOut: prod.priceOut,
          priceIn: prod.priceIn
        });

        saleTotal += prod.priceOut;
      }
    }

    // حفظ عملية البيع
    const sale = new Sale({
      id: saleId,
      date: new Date(),
      items: saleItems,
      paymentMethod: "cash",
      orderNo: saleId
    });

    await sale.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});










app.listen(PORT, () => {
  console.log(`Running at http://localhost:${PORT}`);
});
