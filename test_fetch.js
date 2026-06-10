async function test() {
  try {
    const res = await fetch('http://localhost:4000/api/products');
    const data = await res.json();
    console.log("Products: ", data.products.length);
  } catch (e) {
    console.error(e);
  }
}
test();
