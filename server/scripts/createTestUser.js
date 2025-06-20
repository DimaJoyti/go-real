import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// User schema (simplified version)
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    city: { type: String, required: true },
    role: { type: String, enum: ['client', 'employee', 'manager', 'super_admin'], default: 'client' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createTestUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.ATLAS_URL || process.env.COMPASS_URL);
        console.log('Connected to MongoDB');

        // Check if test user already exists
        const existingUser = await User.findOne({ username: 'testadmin' });
        if (existingUser) {
            console.log('Test admin user already exists!');
            console.log('Username: testadmin');
            console.log('Password: admin123');
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 12);

        // Create test admin user
        const testUser = await User.create({
            firstName: 'Test',
            lastName: 'Admin',
            username: 'testadmin',
            email: 'test@admin.com',
            phone: '1234567890',
            password: hashedPassword,
            city: 'Test City',
            role: 'manager'
        });

        console.log('✅ Test admin user created successfully!');
        console.log('Username: testadmin');
        console.log('Password: admin123');
        console.log('Role: manager');

    } catch (error) {
        console.error('❌ Error creating test user:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createTestUser();
