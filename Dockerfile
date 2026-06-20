FROM python:3.12-slim

# Set work directory
WORKDIR /app

# Copy static assets and python server
COPY index.html style.css app.js server.py /app/

# Ensure results.json exists and has proper permissions
RUN touch /app/results.json

# Expose server port
EXPOSE 8080

# Run the server in headless Docker mode
CMD ["python", "server.py", "--host", "0.0.0.0", "--port", "8080", "--no-browser"]
