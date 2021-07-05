# gogoapi image
# from node image
FROM node:fermium-buster

MAINTAINER toniher <toniher@cau.cat>

# Blast and samtools
RUN mkdir -p /data/soft

WORKDIR /data/soft

# Copy contents to /data/soft
COPY . /data/soft/gogoapi/
 
# Run App
WORKDIR /data/soft/gogoapi

# Install forever
RUN npm install -g forever

# Install app deps
RUN npm install

# Volume for configuration
RUN mkdir -p /data/config
VOLUME /data/config/config.json

#Default port, change if necessary
EXPOSE 4242 
CMD forever index.js /data/config/config.json
