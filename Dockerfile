FROM node:14-slim
RUN apt-get update

ENV HOME_DIR /usr/src/app
ENV DISABLE_TOR_PROXY false

# for https
RUN apt-get install -yyq ca-certificates

# install libraries
RUN apt-get install -yyq libappindicator1 libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6

# tools
RUN apt-get install -yyq gconf-service lsb-release wget xdg-utils

# and fonts
RUN apt-get install -yyq fonts-liberation

# OS dependencies for image manipulation
RUN apt-get install -yyq build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libvips libvips-dev

# Install Tor Proxy dependencies
RUN apt-get install -yyq apt-transport-https curl
RUN echo "deb https://deb.torproject.org/torproject.org/ $(lsb_release -cs) main" > /etc/apt/sources.list.d/tor.list
RUN curl https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc | gpg --import
RUN gpg --export A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89 | apt-key add -
RUN apt update
RUN apt install -yyq tor tor-geoipdb torsocks deb.torproject.org-keyring; \
		tor --version

RUN mkdir -p $HOME_DIR

WORKDIR $HOME_DIR

# Add our package.json and install *before* adding our application files to
# optimize build performance
ADD package.json $HOME_DIR
ADD yarn.lock $HOME_DIR

# install the necessary packages
RUN npm_config_build_from_source=true yarn install --unsafe-perm --save-exact --production
COPY . $HOME_DIR
RUN yarn clean

RUN chmod +x ./docker_entrypoint.sh

ENTRYPOINT ["./docker_entrypoint.sh"]
CMD ["clean"]
