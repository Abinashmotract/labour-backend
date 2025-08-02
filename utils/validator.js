// utils/validators.js
const validator = require('validator');

const validateEmail = (email) => {
    if (!validator.isEmail(email.toLowerCase())) {
        throw new Error('Invalid email format!');
    }
};

const validatePassword = (password) => {
    if (typeof password !== 'string') {
        throw new Error('Password must be a string');
    }

    // Length check
    if (password.length < 8 || password.length > 16) {
        throw new Error('Password must be 8-16 characters');
    }

    // Complexity requirements
    if (!/[A-Z]/.test(password)) {
        throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
        throw new Error('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new Error('Password must contain at least one special character');
    }

    // Common password check (optional)
    const commonPasswords = ['password', '12345678', 'qwertyui'];
    if (commonPasswords.includes(password.toLowerCase())) {
        throw new Error('Password is too common');
    }
};

const validatePostalCode = (postalCode) => {
    if (typeof postalCode !== 'string') {
        throw new Error('Postal code must be a string');
    }

    // Remove all whitespace
    const cleanCode = postalCode.replace(/\s/g, '');

    // Length check
    if (cleanCode.length < 4 || cleanCode.length > 6) {
        throw new Error('Postal code must be 4-6 characters');
    }

    // Format validation (adjust based on country requirements)
    if (!/^[A-Za-z0-9]+$/.test(cleanCode)) {
        throw new Error('Postal code can only contain letters and numbers');
    }

    // Country-specific validation (example for US ZIP codes)
    // if (!/^\d{5}(-\d{4})?$/.test(cleanCode)) {
    //   throw new Error('Invalid US ZIP code format');
    // }
};

const validatePhoneNumber = (phoneNumber) => {
    const phone = String(phoneNumber);
    if (!validator.isMobilePhone(phone)) {
        throw new Error('Invalid phone number format');
    }
};

const validateName = (name) => {
    if (typeof name !== 'string') {
        throw new Error('Name must be a string');
    }

    // Trim and check empty name
    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error('Name cannot be empty');
    }

    // Check minimum length (after trim)
    if (trimmedName.length < 2) {
        throw new Error('Name must be at least 2 characters');
    }

    // Unicode-aware letter validation (supports international names)
    if (!/^[\p{L}\s']+$/u.test(trimmedName)) {
        throw new Error('Name can only contain letters, spaces, and apostrophes');
    }

    // Optional: Check maximum length
    if (trimmedName.length > 50) {
        throw new Error('Name cannot exceed 50 characters');
    }
};

module.exports = {
    validateEmail,
    validatePassword,
    validatePhoneNumber,
    validateName,
    validatePostalCode
    // Add more validators as needed
};