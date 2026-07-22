# 📚 Python Notebook Examples

Collection of example code for **Python Notebook v3.0**. Copy and paste these into your notebook cells.

---

## 🐍 Basic Python

### Hello World
```python
print("Hello, World!")
```

### Variables and Types
```python
name = "Python"
version = 3.11
pi = 3.14159

print(f"{name} version {version}")
print(f"Pi ≈ {pi}")
```

### Lists and Loops
```python
fruits = ["apple", "banana", "cherry", "date"]
print("Fruits:")
for fruit in fruits:
    print(f"  - {fruit}")
```

### Dictionary Operations
```python
person = {
    "name": "Alice",
    "age": 30,
    "city": "New York"
}

for key, value in person.items():
    print(f"{key}: {value}")
```

### Functions
```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))
print(greet("Bob", "Hi"))
```

---

## 📊 Data Analysis with Pandas

### Install and Basic Usage
```python
!pip install pandas
import pandas as pd

# Create a simple dataset
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'David'],
    'Age': [25, 30, 28, 35],
    'Salary': [50000, 60000, 55000, 70000]
}

df = pd.DataFrame(data)
print(df)
print(f"\nMean age: {df['Age'].mean()}")
print(f"Max salary: {df['Salary'].max()}")
```

### CSV Data Processing
```python
# Create sample CSV data
csv_data = """Name,Score,Grade
Alice,95,A
Bob,87,B
Charlie,92,A
David,78,C
Eve,88,B"""

# Read and process
from io import StringIO
df = pd.read_csv(StringIO(csv_data))

# Group by grade
grades = df.groupby('Grade')['Score'].agg(['mean', 'count'])
print("Grade Statistics:")
print(grades)
```

---

## 🔢 Numerical Computing with NumPy

### Install and Basic Arrays
```python
!pip install numpy
import numpy as np

# Create arrays
arr1 = np.array([1, 2, 3, 4, 5])
arr2 = np.arange(0, 10, 2)  # 0 to 10, step 2

print("Array 1:", arr1)
print("Array 2:", arr2)
print("Sum:", arr1.sum())
print("Mean:", arr1.mean())
print("Std Dev:", arr1.std())
```

### Matrix Operations
```python
import numpy as np

matrix_a = np.array([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
])

matrix_b = np.array([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
])

print("Matrix A:")
print(matrix_a)
print("\nMatrix B (Identity):")
print(matrix_b)
print("\nMatrix Multiplication:")
print(np.dot(matrix_a, matrix_b))
```

### Random Data and Statistics
```python
import numpy as np

# Generate random data
data = np.random.normal(loc=100, scale=15, size=1000)

print(f"Mean: {np.mean(data):.2f}")
print(f"Std Dev: {np.std(data):.2f}")
print(f"Min: {np.min(data):.2f}")
print(f"Max: {np.max(data):.2f}")
print(f"Median: {np.median(data):.2f}")
```

---

## 🌐 Web Requests

### Basic HTTP Requests
```python
!pip install requests
import requests

# Get public IP
response = requests.get('https://api.ipify.org?format=json')
print(f"Your IP: {response.json()['ip']}")

# Get weather (free API)
response = requests.get('https://wttr.in/London?format=j1')
weather = response.json()
print(f"Weather data loaded for London")
```

### JSON Processing
```python
import json

data = {
    "users": [
        {"name": "Alice", "age": 25},
        {"name": "Bob", "age": 30}
    ]
}

# To JSON string
json_string = json.dumps(data, indent=2)
print(json_string)

# From JSON string
parsed = json.loads(json_string)
print(f"\nUsers: {parsed['users'][0]['name']}")
```

---

## ⏱️ Time and Scheduling

### Current Time and Dates
```python
from datetime import datetime, timedelta

# Current time
now = datetime.now()
print(f"Current: {now.strftime('%Y-%m-%d %H:%M:%S')}")

# Calculate future date
future = now + timedelta(days=7)
print(f"In 7 days: {future.strftime('%Y-%m-%d')}")

# Days until new year
new_year = datetime(2024, 1, 1)
days_left = (new_year - now).days
print(f"Days until 2024: {days_left}")
```

### Timing Code Execution
```python
import time

start = time.time()

# Simulate work
for i in range(1000000):
    pass

elapsed = time.time() - start
print(f"Execution time: {elapsed:.4f} seconds")
```

---

## 📁 File Operations

### Read and Write Files
```python
# Write to file
with open('example.txt', 'w') as f:
    f.write("Hello from Python Notebook!\n")
    f.write("This is line 2\n")

# Read from file
with open('example.txt', 'r') as f:
    content = f.read()
print(content)

# Read line by line
with open('example.txt', 'r') as f:
    for i, line in enumerate(f, 1):
        print(f"Line {i}: {line.rstrip()}")
```

### Working with Directories
```python
import os

# Create directory
os.makedirs('test_dir', exist_ok=True)

# List files
files = os.listdir('.')
print("Files in current directory:")
for f in files[:5]:  # Show first 5
    print(f"  - {f}")

# Check file exists
exists = os.path.exists('example.txt')
print(f"\nexample.txt exists: {exists}")
```

---

## 🎨 String Operations

### String Manipulation
```python
text = "Hello, Python Notebook!"

print(f"Original: {text}")
print(f"Uppercase: {text.upper()}")
print(f"Lowercase: {text.lower()}")
print(f"Reversed: {text[::-1]}")
print(f"Length: {len(text)}")

# String methods
print(f"Starts with 'Hello': {text.startswith('Hello')}")
print(f"Ends with '!': {text.endswith('!')}")
print(f"Contains 'Python': {'Python' in text}")
```

### Regular Expressions
```python
import re

text = "Email: alice@example.com, bob@test.org"

# Find all emails
emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
print("Found emails:")
for email in emails:
    print(f"  - {email}")

# Replace pattern
result = re.sub(r'@\w+\.', '@***', text)
print(f"\nMasked: {result}")
```

---

## 🔐 Security & Hashing

### Password Hashing
```python
!pip install bcrypt
import bcrypt

password = "my_secure_password"

# Hash password
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(f"Hashed: {hashed}")

# Verify password
is_valid = bcrypt.checkpw(password.encode('utf-8'), hashed)
print(f"Password valid: {is_valid}")
```

### Hash Strings
```python
import hashlib

text = "Hello, World!"

# MD5 (not for security, just demo)
md5 = hashlib.md5(text.encode()).hexdigest()
print(f"MD5: {md5}")

# SHA256 (better)
sha256 = hashlib.sha256(text.encode()).hexdigest()
print(f"SHA256: {sha256}")
```

---

## 🎯 Object-Oriented Programming

### Classes and Objects
```python
class Dog:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def bark(self):
        return f"{self.name} says Woof!"

    def __str__(self):
        return f"{self.name} ({self.age} years old)"

# Create objects
dog1 = Dog("Buddy", 3)
dog2 = Dog("Max", 5)

print(dog1)
print(dog2)
print(dog1.bark())
```

### Inheritance
```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        pass

class Cat(Animal):
    def speak(self):
        return f"{self.name} says Meow!"

class Dog(Animal):
    def speak(self):
        return f"{self.name} says Woof!"

# Use subclasses
animals = [Cat("Whiskers"), Dog("Buddy")]
for animal in animals:
    print(animal.speak())
```

---

## 🔄 Generators and Comprehensions

### List Comprehensions
```python
# Simple comprehension
squares = [x**2 for x in range(1, 6)]
print(f"Squares: {squares}")

# With condition
even_squares = [x**2 for x in range(1, 11) if x % 2 == 0]
print(f"Even squares: {even_squares}")

# Nested comprehension
matrix = [[i*j for j in range(1, 4)] for i in range(1, 4)]
print("Matrix:")
for row in matrix:
    print(row)
```

### Generators
```python
def count_up(n):
    i = 0
    while i < n:
        yield i
        i += 1

print("Generator output:")
for num in count_up(5):
    print(num, end=" ")
print()

# With generator expression
gen = (x**2 for x in range(1, 6))
print(f"Generator squares: {list(gen)}")
```

---

## 🧪 Testing and Debugging

### Assertions
```python
def divide(a, b):
    assert b != 0, "Cannot divide by zero!"
    return a / b

try:
    result = divide(10, 2)
    print(f"10 / 2 = {result}")

    result = divide(10, 0)
except AssertionError as e:
    print(f"Error: {e}")
```

### Debugging with Print
```python
def calculate(x, y):
    result = x + y
    print(f"DEBUG: x={x}, y={y}, result={result}")
    result = result * 2
    print(f"DEBUG: after multiply, result={result}")
    return result

answer = calculate(5, 3)
print(f"Final: {answer}")
```

---

## 📈 Plotting Data (Matplotlib)

### Line Chart
```python
!pip install matplotlib
import matplotlib.pyplot as plt

# Data
x = [1, 2, 3, 4, 5]
y = [1, 4, 9, 16, 25]

plt.figure(figsize=(8, 5))
plt.plot(x, y, marker='o', label='y=x²')
plt.xlabel('X')
plt.ylabel('Y')
plt.title('Simple Plot')
plt.legend()
plt.grid(True)
plt.show()
```

---

## 🎓 Tips & Tricks

### Timing Code with Decorator
```python
import time

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"Executed in {time.time()-start:.4f}s")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)
    return "Done!"

slow_function()
```

### Exception Handling Best Practices
```python
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        print("Error: Cannot divide by zero")
        return None
    except TypeError:
        print("Error: Invalid types for division")
        return None
    finally:
        print("Operation completed")

safe_divide(10, 2)
safe_divide(10, 0)
```

---

## 🚀 Advanced Examples

### Concurrent Processing
```python
!pip install concurrent.futures
from concurrent.futures import ThreadPoolExecutor
import time

def process_item(item):
    time.sleep(0.5)
    return item * 2

items = [1, 2, 3, 4, 5]
with ThreadPoolExecutor(max_workers=3) as executor:
    results = list(executor.map(process_item, items))

print(f"Results: {results}")
```

### Context Managers
```python
class FileManager:
    def __init__(self, filename, mode):
        self.filename = filename
        self.mode = mode

    def __enter__(self):
        self.file = open(self.filename, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.file:
            self.file.close()

# Usage
with FileManager('test.txt', 'w') as f:
    f.write("Hello from context manager!")
```

---

## 📚 More Resources

- **Python Docs:** https://docs.python.org/3/
- **Pandas Documentation:** https://pandas.pydata.org/
- **NumPy Guide:** https://numpy.org/doc/
- **Requests Library:** https://requests.readthedocs.io/
- **Matplotlib Gallery:** https://matplotlib.org/gallery.html

---

**Happy learning! 🐍**