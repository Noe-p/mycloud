help:
	@echo "Liste des commandes disponibles :"
	@grep -E '^[1-9a-zA-Z_-]+(\.[1-9a-zA-Z_-]+)?:.*?## .*$$|(^#--)' $(MAKEFILE_LIST) \
	| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m %-43s\033[0m %s\n", $$1, $$2}' \
	| sed -e 's/\[32m #-- /[33m/'

#-- DÉVELOPPEMENT
dev: ## Démarre le serveur de développement
	bun dev

build: ## Construit l'application pour la production
	yarn build

#-- GESTION DES DÉPENDANCES
install: ## Installe les dépendances
	bun install

#-- COMPONENTS
component.add: ## Ajoute un composant de shadcn/ui
	npx shadcn-ui@latest add

component.init: ## Initialise shadcn/ui
	npx shadcn-ui@latest init

#-- NETTOYAGE
clean: ## Nettoie les fichiers générés
	rm -rf .next
	rm -rf node_modules
	rm -rf dist

clean.cache: ## Nettoie le cache
	rm -rf .next/cache
	bun run clean

#-- GIT
clean-merged-branches: ## Supprime les branches mergées
	git branch --merged | grep -v '\*\|master\|dev\|prod\|main\|test' | xargs -n 1 git branch -d
	git branch -r --merged | grep -v '\*\|master\|dev\|prod\|main\|test' | sed 's/origin\///' | xargs -n 1 git push --delete origin

#-- UTILITAIRES
setup: ## Configure le template pour un nouveau projet
	./scripts/setup-template.sh

setup.help: ## Affiche l'aide pour la configuration
	@echo "Configuration du template..."
	@echo "Utilisez : make setup"
	@echo "Ou directement : ./scripts/setup-template.sh --name nom-projet --description 'Description' --author 'Auteur' --email 'email@example.com'"

