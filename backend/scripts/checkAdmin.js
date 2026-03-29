const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');

(async () => {
  try {
    const uri = 'mongodb+srv://vetadmin:admin1@cluster0.0u3ycor.mongodb.net/asset_manager?retryWrites=true&w=majority';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    const Teacher = mongoose.model('Teacher', new mongoose.Schema({}, { strict: false }));
    const user = await Teacher.findOne({ email: 'admin@gmail.com' }).lean();

    const result = {
      found: Boolean(user),
      email: user?.email || null,
      role: user?.role || null,
      hashSample: user?.password ? user.password.slice(0, 10) : null,
      passwordMatches: user ? await bcrypt.compare('admin123', user.password) : null,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync('admin_check.json', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    fs.writeFileSync('admin_check.json', JSON.stringify({ error: err.message || String(err) }, null, 2));
    process.exit(1);
  }
})();
