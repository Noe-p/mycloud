# � MyCloud

MyCloud est une bibliothèque de médias auto-hébergée, idéale pour stocker vos photos et vidéos sur un Raspberry Pi. Il vous suffit de suivre les instructions ci-dessous.

MyCloud reproduit simplement la photothèque d'Apple, mais hébergée chez vous et donc **sans frais**. Parfait pour stocker les photos qui traînent sur un disque externe et y avoir accès depuis votre smartphone.

## 🚀 Installation

### 1. Se connecter en SSH sur votre Raspberry Pi

```bash
ssh pi@adresse_du_pi
```

### 2. Installer Docker

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur au groupe Docker
sudo usermod -aG docker $USER

# Redémarrer la session ou le Pi
sudo reboot
```

### 3. Créer le dossier MyCloud

```bash
mkdir -p ~/mycloud
cd ~/mycloud
```

### 4. Créer le fichier docker-compose.yml

Créez un fichier `docker-compose.yml` avec le contenu suivant :

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/noe-p/mycloud:latest
    container_name: mycloud-app
    restart: always
    ports:
      - '3000:3000'
    environment:
      - MEDIA_DIRS=/media/photos
    volumes:
      # Vos photos (modifiez le chemin avant les :)
      - /chemin/vers/vos/photos:/media/photos:ro
      # Données persistantes (miniatures et utilisateurs)
      - thumbs-data:/home/app/standalone/public/thumbs
      - users-data:/home/app/standalone/data

volumes:
  thumbs-data:
  users-data:
```

**Important** :

- Remplacez `/chemin/vers/vos/photos` par le chemin réel vers vos médias (exemple : `/mnt/ssd/Photos`)
- Pour plusieurs dossiers, ajoutez des lignes et séparez-les par des virgules dans `MEDIA_DIRS` :
  ```yaml
  environment:
    - MEDIA_DIRS=/media/photos,/media/videos
  volumes:
    - /chemin/vers/photos:/media/photos:ro
    - /chemin/vers/videos:/media/videos:ro
  ```

### 5. Lancer MyCloud

```bash
docker-compose up -d
```

### 6. Accéder à MyCloud

Ouvrez votre navigateur et allez à :

```
http://adresse_du_pi:3000
```

Par exemple : `http://192.168.1.100:3000`

### 7. Lancer un scan

1. Connectez-vous avec vos identifiants
2. Accédez aux paramètres
3. Cliquez sur "Lancer un scan"
4. MyCloud va scanner vos dossiers et indexer tous vos médias

## ✨ Fonctionnalités

- 📱 **Interface responsive** - Accédez à vos médias depuis n'importe quel appareil
- 🖼️ **Albums** - Organisez vos médias par albums et sous-albums
- 🔍 **Métadonnées EXIF** - Lecture automatique des données de vos photos
- 🎨 **Miniatures optimisées** - Génération automatique pour une navigation rapide
- 🌍 **Multi-langues** - Interface en français et anglais
- 🔒 **Authentification** - Protégez l'accès à vos médias
- 🐳 **Docker** - Installation simple et portable
