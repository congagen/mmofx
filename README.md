
# MMOSFX


## Testing:
### HTTP:
```sh
$ python3 -m http.server -d .
-> 0.0.0.0:8000
```


### HTTPS (MAC):
```sh
brew install nss
npm i -g --only=prod https-localhost
serve .
-> https://localhost
```


### HTTPS (LINUX):
```sh
sudo apt install libnss3-tools
sudo yum install nss-tools
sudo pacman -S nss
-> https://localhost
```


## TODO:
1. Polyphony Modes
2. Mic Input?
3. Mixer Routing?
