const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

public_users.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Unable to register user. Username and password required." });
    }

    if (isValid(username)) {
        return res.status(404).json({ message: "User already exists!" });
    }

    users.push({ username: username, password: password });
    return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop - using async/await with Axios
public_users.get('/', async function (req, res) {
    try {
        const response = await axios.get(`${BASE_URL}/books-internal`);
        return res.status(200).send(JSON.stringify(response.data, null, 4));
    } catch (err) {
        return res.status(200).send(JSON.stringify(books, null, 4));
    }
});

// Get book details based on ISBN - using Promise callbacks with Axios
public_users.get('/isbn/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    axios.get(`${BASE_URL}/isbn-internal/${isbn}`)
        .then(response => {
            return res.status(200).json(response.data);
        })
        .catch(() => {
            if (books[isbn]) {
                return res.status(200).json(books[isbn]);
            }
            return res.status(404).json({ message: "Book not found" });
        });
});

// Get book details based on author - using async/await with Axios
public_users.get('/author/:author', async function (req, res) {
    const author = req.params.author;
    try {
        const response = await axios.get(`${BASE_URL}/author-internal/${encodeURIComponent(author)}`);
        return res.status(200).json(response.data);
    } catch (err) {
        const result = {};
        Object.keys(books).forEach((key) => {
            if (books[key].author === author) {
                result[key] = books[key];
            }
        });
        if (Object.keys(result).length > 0) {
            return res.status(200).json(result);
        }
        return res.status(404).json({ message: "No books found by this author" });
    }
});

// Get all books based on title - using Promise callbacks with Axios
public_users.get('/title/:title', function (req, res) {
    const title = req.params.title;
    axios.get(`${BASE_URL}/title-internal/${encodeURIComponent(title)}`)
        .then(response => {
            return res.status(200).json(response.data);
        })
        .catch(() => {
            const result = {};
            Object.keys(books).forEach((key) => {
                if (books[key].title === title) {
                    result[key] = books[key];
                }
            });
            if (Object.keys(result).length > 0) {
                return res.status(200).json(result);
            }
            return res.status(404).json({ message: "No books found with this title" });
        });
});

// Get book review
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    if (books[isbn]) {
        return res.status(200).json(books[isbn].reviews);
    } else {
        return res.status(404).json({ message: "Book not found" });
    }
});

// Internal endpoints (used by Axios to demonstrate async calls)
public_users.get('/books-internal', (req, res) => {
    return res.status(200).json(books);
});

public_users.get('/isbn-internal/:isbn', (req, res) => {
    const isbn = req.params.isbn;
    if (books[isbn]) {
        return res.status(200).json(books[isbn]);
    }
    return res.status(404).json({ message: "Not found" });
});

public_users.get('/author-internal/:author', (req, res) => {
    const author = req.params.author;
    const result = {};
    Object.keys(books).forEach((key) => {
        if (books[key].author === author) result[key] = books[key];
    });
    if (Object.keys(result).length > 0) return res.status(200).json(result);
    return res.status(404).json({ message: "Not found" });
});

public_users.get('/title-internal/:title', (req, res) => {
    const title = req.params.title;
    const result = {};
    Object.keys(books).forEach((key) => {
        if (books[key].title === title) result[key] = books[key];
    });
    if (Object.keys(result).length > 0) return res.status(200).json(result);
    return res.status(404).json({ message: "Not found" });
});

module.exports.general = public_users;