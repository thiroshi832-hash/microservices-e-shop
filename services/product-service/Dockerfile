FROM node:18-alpine

WORKDIR /app

# Install dependencies including Prisma
COPY package*.json ./
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 5002

# Start the application with Prisma db push
CMD ["sh", "-c", "npx prisma db push && node index.js"]
