import requests

resp = requests.post("http://localhost:5000/api/run", json={"code": """
import multiprocessing
import time
import sys

def worker(x):
    time.sleep(10)
    return x

if __name__ == '__main__':
    p = multiprocessing.Pool(2)
    p.map_async(worker, [1, 2])
    time.sleep(10)
""", "timeout": 2})
print(resp.json())
