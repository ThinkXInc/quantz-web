### Quantz
![Screenshot 2024-03-16 at 8 50 49](https://github.com/ThinkXInc/quantz/assets/3203107/6b439ad7-9c9e-47b4-a682-f3ddf014bf9d)

## Getting Started


Prerequisites:
- Python, version >= 3.7
- Nginx, version >= 1.19.10
- Node.js, version >= 14.17.0

  

## References


#### install autoenv (bash user)
```bash
cd ~
curl -#fLo- 'https://raw.githubusercontent.com/hyperupcall/autoenv/master/scripts/install.sh' | sh
echo 'source ~/.autoenv/activate.sh' >> ~/.bashrc
echo 'export AUTOENV_ENV_FILENAME=.autoenv' >> ~/.bashrc
echo 'export AUTOENV_ENV_LEAVE_FILENAME=.autoenv_leave' >> ~/.bashrc
source ~/.bashrc
```  

#### install python3.9.7
https://www.python.org/downloads/macos/
  
  
  
#### install node
https://nodejs.org/ja/download/

```bash
$ npm -v
```

#### install nginx
```
$ brew install marcqualie/nginx/nginx-full --with-gzip-static --with-image-filter
$ nginx -V
nginx version: nginx/1.19.10
built by clang 12.0.0 (clang-1200.0.32.27)
built with OpenSSL 1.1.1m  14 Dec 2021
TLS SNI support enabled
configure arguments:
...
 --with-http_gzip_static_module --with-http_image_filter_module  <-- (1
```
*if you already have nginx, please check if options (1 are added. if not, you need to `brew uninstall nginx` and install again.


## License


Proprietary License

Copyright © ThinkX,Inc All Rights Reserved.

This software and associated documentation files (the "Software") are proprietary to ThinkX,Inc, and are not to be copied, reproduced, transmitted, disseminated, reverse-engineered, or used in any way unless expressly permitted by ThinkX,Inc. 

Use of this software is subject to the terms and conditions of a legal agreement between you and ThinkX,Inc. Unauthorized use of this software may cause ThinkX,Inc to assert its legal rights to the fullest extent of the law, and you may be subject to penalties.
