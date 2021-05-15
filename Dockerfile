# gogoapi image
# from node image
FROM node:fermium-buster

MAINTAINER toniher <toniher@cau.cat>

# Blast and samtools
RUN mkdir -p /data/soft

WORKDIR /data/soft

# Clone Master and Install dependencies
RUN git clone https://github.com/toniher/gogoapi.git
 
# Run App
WORKDIR /data/soft/gogoapi

# Install forever
RUN npm install -g forever

# Install app deps
RUN npm install

# Execute npm run
RUN npm run build

# Volume for configuration
RUN mkdir -p /data/config
VOLUME /data/config

#Default port, change if necessary
EXPOSE 4242 
CMD NODE_ENV=production forever index.js /data/config/config.json
