# ---- Base Node ----
FROM node:8

# Create app directory
WORKDIR /opt

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json .

# install app dependencies including 'devDependencies'
RUN npm install

# change PATH to add node tools
ENV PATH /opt/node_modules/.bin:$PATH

# working dir for source code
WORKDIR /opt/app
