# mv testserver.com ../../../../etc/nginx/sites-available/api.$1.dosystemsinc.com 2>&1 | tee -a test1234.txt
# mv testserver1.com ../../../../etc/nginx/sites-enabled/api.$1.dosystemsinc.com 2>&1 | tee -a test1234.txt
# # mv clientServer.com ../../../../etc/nginx/sites-available/$1.dosystemsinc.com 2>&1 | tee -a test12345.txt
# # echo testnitttttttt
# # mv clientServer1.com ../../../../etc/nginx/sites-enabled/$1.dosystemsinc.com 2>&1 | tee -a test12345.txt

# certbot --nginx --non-interactive --agree-tos -d api.$1.dosystemsinc.com --redirect


# mv babelrc.com ../../../../var/www/api.$1.dosystemsinc.com/server/.babelrc
# PATH="/root/.nvm/versions/node/v22.16.0/bin:$PATH"

# # install node modules
# # /root/.nvm/versions/node/v22.16.0/bin/npm install
# ln -s ~/modules/node_modules node_modules

# echo successfull
# # PATH="/root/.nvm/versions/node/v22.16.0/bin:$PATH"
# # /root/.nvm/versions/node/v22.16.0/bin/node server-start.js 2>&1 | tee -a test1234.txt

# #add name to pm2
# # mongorestore --db $1 mongodump/$1 --noIndexRestore

# echo uttej entered
# # mongo is deprecated in mongodb 7, replace with mongosh 
# mongosh admin -u jayeesha -p J@yee$#@@5G5G --eval "db.getSiblingDB('$1').createUser({user: '$1', pwd: 'Admin1234$', roles: ['readWrite']})"

# PATH="/root/.nvm/versions/node/v22.16.0/bin:$PATH"
# if [ "$2" = "update" ]; then
#     /root/.nvm/versions/node/v22.16.0/bin/pm2 delete $3
# fi
# /root/.nvm/versions/node/v22.16.0/bin/pm2 start server-start.js --name $1 2>&1 | tee -a test1234.txt 

# pm2 restart $1

# echo RESTART SUCCESSFULL

# service nginx restart 2>&1 | tee -a test1234.txt


#!/bin/bash

DOMAIN=$1
ACTION=$2
PM2_NAME=$3

LOG_FILE="test1234.txt"
NODE_BIN="/root/.nvm/versions/node/v22.16.0/bin"
export PATH="$NODE_BIN:$PATH"

echo "🚀 Starting deployment for $DOMAIN" | tee -a $LOG_FILE

# Move nginx config files
mv testserver.com /etc/nginx/sites-available/api.$DOMAIN.dosystemsinc.com 2>&1 | tee -a $LOG_FILE
mv testserver1.com /etc/nginx/sites-enabled/api.$DOMAIN.dosystemsinc.com 2>&1 | tee -a $LOG_FILE

# Check if SSL cert already exists
CERT_PATH="/etc/letsencrypt/live/api.$DOMAIN.dosystemsinc.com"
if [ -d "$CERT_PATH" ]; then
  echo "✅ SSL already exists for api.$DOMAIN.dosystemsinc.com. Skipping certbot." | tee -a $LOG_FILE
else
  echo "🔒 Generating SSL for api.$DOMAIN.dosystemsinc.com" | tee -a $LOG_FILE
  #certbot --nginx --non-interactive --agree-tos --email your@email.com -d api.$DOMAIN.dosystemsinc.com --redirect 2>&1 | tee -a $LOG_FILE
fi

# Copy .babelrc
mv babelrc.com /var/www/api.$DOMAIN.dosystemsinc.com/server/.babelrc

# Link node_modules
cd /var/www/api.$DOMAIN.dosystemsinc.com/server
[ -L node_modules ] || ln -s ~/modules/node_modules node_modules

echo "✅ Node modules linked" | tee -a $LOG_FILE

# MongoDB user creation (mongosh)
echo "📦 Setting up MongoDB user" | tee -a $LOG_FILE
mongosh admin -u jayeesha -p 'J@yee$#@@5G5G' --eval "db.getSiblingDB('$DOMAIN').createUser({user: '$DOMAIN', pwd: 'Admin1234$', roles: ['readWrite']})" 2>&1 | tee -a $LOG_FILE

# PM2 setup
if [ "$ACTION" = "update" ]; then
    echo "♻️ Updating existing PM2 process: $PM2_NAME" | tee -a $LOG_FILE
    pm2 delete "$PM2_NAME" 2>&1 | tee -a $LOG_FILE
fi

echo "🚀 Starting PM2 for $DOMAIN" | tee -a $LOG_FILE
pm2 start server-start.js --name "$DOMAIN" 2>&1 | tee -a $LOG_FILE
pm2 restart "$DOMAIN" 2>&1 | tee -a $LOG_FILE

echo "✅ PM2 restart successful" | tee -a $LOG_FILE

# Restart nginx
echo "🔄 Restarting NGINX..." | tee -a $LOG_FILE
service nginx restart 2>&1 | tee -a $LOG_FILE

echo "🎉 Deployment complete for $DOMAIN" | tee -a $LOG_FILE
