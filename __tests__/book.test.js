//Integration tests for books route.

process.env.NODE_ENV = "test"

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let isbn;

beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (
        isbn, 
        amazon_url, 
        author, 
        language, 
        pages, 
        publisher, 
        title, 
        year)
      VALUES(
        '123-4-56-678901-2',
        'https://amazon.com/test',
        'Test',
        'English',
        500,
        'Testing Publisher',
        'Test Book', 
        2020)
      RETURNING isbn`);

  isbn = result.rows[0].isbn
});

describe("GET /books", function () {
  test("Gets a list of one book.", async function () {
    const res = await request(app).get(`/books`);
    const books = res.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("year");
  });
});

describe("GET /books/:isbn", function () {
  test("Gets a book with a matching isbn.", async function () {
    const res = await request(app).get(`/books/${isbn}`)
    expect(res.body.book).toHaveProperty("isbn");
    expect(res.body.book).toHaveProperty("year");
    expect(res.body.book.isbn).toBe(isbn);
  });

  test("Responds with 404 if book cannot be found.", async function () {
    const res = await request(app).get(`/books/20`)
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /books", function () {
  test("Creates new book.", async function () {
    const res = await request(app).post(`/books`)
        .send({
          isbn: '123-4-56-678901-4',
          amazon_url: "https://amazon.com/test2",
          author: "Test2",
          language: "English",
          pages: 800,
          publisher: "Test Publisher 2",
          title: "Test Book 2",
          year: 2022
        });
    expect(res.statusCode).toBe(201);
    expect(res.body.book).toHaveProperty("isbn");
  });

  test("Checks error if creating book without required title", async function () {
    const res = await request(app).post(`/books`)
        .send({year: 2000});
    expect(res.statusCode).toBe(400);
  });
});

describe("PUT /books/:id", function () {
  test("Updates a book with a matching isbn.", async function () {
    const res = await request(app).put(`/books/${isbn}`)
        .send({
          author: "Test2",
          language: "English",
          pages: 800,
          publisher: "Test Publisher 2",
          title: "Test Book 2",
          year: 2022
        });
    expect(res.body.book).toHaveProperty("author");
    expect(res.body.book.author).toBe("Test2");
  });

  test("Checks that a book cannot update with titles that are not allowed.", async function () {
    const res = await request(app).put(`/books/${book_isbn}`)
        .send({
          author: "Test2",
          language: "English",
          pages: 800,
          publisher: "Test Publisher 2",
          title: "Test Book 2",
          year: 2022,
          notAllowed: "This should not work"
        });
    expect(res.statusCode).toBe(400);
  });

  test("Checks for 404 error if isbn cannot be found.", async function () {
    const res = await request(app).delete(`/books/40`);
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /books/:id", function () {
  test("Deletes a book witch matching isbn.", async function () {
    const res = await request(app).delete(`/books/${isbn}`)
    expect(res.body).toEqual({message: "Book deleted"});
  });
});

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});


afterAll(async function () {
  await db.end()
});