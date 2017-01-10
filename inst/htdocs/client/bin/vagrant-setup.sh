#!/usr/bin/env bash

printf "[bootstrap] Adding EPEL Repo\n";
yum --quiet -y install http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm

printf "[bootstrap] installing dev toolsset and dev tools\n";
yum install --quiet -y centos-release-scl-rh
yum install --quiet -y devtoolset-3-gcc devtoolset-3-gcc-c++

printf "[bootstrap] use new gcc versions to be able to compile C++ v11\n";

# install useful dev tools
printf "[bootstrap] installing dev tools\n";
yum --quiet -y install mc vim krb5-devel git

printf "[bootstrap] installing project system dependencies";
# http://sameerhalai.com/blog/how-to-install-phantomjs-on-a-centos-server/
yum --quiet -y install fontconfig

printf "[bootstrap] Installing Node\n";
curl --silent --location https://rpm.nodesource.com/setup_4.x | bash -
yum --quiet -y install nodejs

printf "[bootstrap] installing node global packages\n";
npm config set color false
scl enable devtoolset-3 "npm install -q -g nodemon"

# create symlink for node_modules
printf "[bootstrap] setting up project directories\n";
mkdir -p /home/vagrant/node_modules
mkdir -p /home/vagrant/jspm_packages

printf "[bootstrap] installing project packages\n";
cd /home/vagrant/app
rm -rf node_modules
rm -rf jspm_packages
ln -s /home/vagrant/node_modules node_modules
ln -s /home/vagrant/jspm_packages jspm_packages

# we need to enable gcc 4.9.2 to be able to compile against C++ v.11
scl enable devtoolset-3 "npm install -q"
cd /home/vagrant
chown -R vagrant:vagrant node_modules
chown -R vagrant:vagrant jspm_packages

echo "export PATH=node_modules/.bin:\$PATH" >> /home/vagrant/.bashrc

echo "-------------------------------------------------------"
echo "In order to install jspm modules, please run"
echo "jspm install for the first time. It is recommended"
echo "to provide your own github auth-token to finish installation"
echo " "
echo "To start local webserver use:"
echo "$ gulp serve"
echo "-------------------------------------------------------"
