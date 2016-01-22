self.onmessage = function(e) {
    console.log("worker: Received " + e.data);
};

self.postMessage('msg from worker to main thread ');
