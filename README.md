# git-tree
a command to deploy last modified files with structure
## Installation
````
npm install -g git+https://github.com/jeryckho/git-tree.git
````
## Suppression

````
npm list -g --depth=0
npm uninstall -g git-tree
````
## Utilisation
````
git-tree -h

 Usage: git-tree [options]

 Options:

    -V, --version        output the version number
    -C, --cmd <command>  Add a command
    -D, --deploy <path>  Path to deploy
    -c, --clean          Clean deploy path
    -d, --dry            No action, just list files
    -h, --help           output usage information
````
## Synopsis

Déployer les fichiers du dernier commit :
````
git-tree -C -1
`````