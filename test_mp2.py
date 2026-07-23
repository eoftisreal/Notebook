import multiprocessing
import time
import sys

def worker(x):
    time.sleep(1)
    return x * x

if __name__ == '__main__':
    p = multiprocessing.Pool(2)
    p.map_async(worker, [1, 2, 3])
    time.sleep(0.5)
    sys.exit(1) # Parent exits while workers are running
