#Site Demo

##System Setup Instructions
1. Open up your terminal (CMD+space and type in 'terminal')
2. Install Brew by pasting this command into the terminal--> /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
3. Make sure you have the latest version of Brew by pasting this command into the terminal--> brew update
4. Install Node by pasting this command into the terminal--> brew install node
5. Make sure you have the latest version of Node installed by pasting this command into the terminal--> brew update node
6. Install GitHub tools by pasting this command into the terminal--> brew install git

You only have to do this once these tools are on your machine for future use

##Download Application
1. Use the terminal to navigate to a folder that will hold the application
2. Clone/copy the files to the directory by pasting this command into the terminal--> git clone https://github.com/qbi11y/site-demo.git


##Run Application
1. Use the terminal to navigate to the folder where the application was cloned. Make sure you're in the application folder
2. Run the application by pasting this command into the terminal--> node server.js
3. Open a browser and go to localhost:3000 - should see a blank page with a header and navigation
4. Place images into the app/images folder, images will appear on web page as they are loaded into the folder.