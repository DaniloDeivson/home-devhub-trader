import logging
from main import app  


logging.getLogger('werkzeug').setLevel(logging.ERROR)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
