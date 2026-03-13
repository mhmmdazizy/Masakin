const crypto = require('crypto');
const admin = require('firebase-admin');

// Konek ke Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '') : undefined, 
        })
    });
}

const db = admin.firestore();

module.exports = async function(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Jalur dilarang. Webhook ini khusus POST Midtrans.' });

    try {
        const data = req.body;

        // 👇 JALUR VIP KHUSUS TOMBOL "TEST" MIDTRANS 👇
        // Kalau data bohongan nggak ada UID-nya, kita senyumin dan kasih 200 OK aja
        if (!data.custom_field1 || !data.order_id) {
            console.log("Menerima Ping Test dari Dashboard Midtrans!");
            return res.status(200).json({ message: 'OK - Test Notifikasi Berhasil!' });
        }
        // 👆 ========================================== 👆

        if (!process.env.MIDTRANS_SERVER_KEY) throw new Error("MIDTRANS_SERVER_KEY belum di-set di Vercel");
        
        // Pengecekan Keamanan Asli
        const hash = crypto.createHash('sha512').update(`${data.order_id}${data.status_code}${data.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`).digest('hex');
        if (data.signature_key !== hash) {
            return res.status(403).json({ message: 'Akses ditolak. Keamanan tidak valid.' });
        }

        const transactionStatus = data.transaction_status;
        const fraudStatus = data.fraud_status;
        const uid = data.custom_field1; 

        if (transactionStatus == 'capture' || transactionStatus == 'settlement') {
            if (fraudStatus == 'accept' || !fraudStatus) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30); 

                await db.collection('users').doc(uid).update({
                    isPremium: true,
                    premiumStatus: "approved",
                    premiumExpiresAt: admin.firestore.Timestamp.fromDate(expiryDate)
                });
            }
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
            await db.collection('users').doc(uid).update({
                premiumStatus: "failed"
            });
        }

        res.status(200).json({ message: 'OK' });

    } catch (error) {
        console.error("WEBHOOK ERROR:", error.message);
        res.status(500).json({ error: "Terjadi kesalahan server", detail: error.message });
    }
};
