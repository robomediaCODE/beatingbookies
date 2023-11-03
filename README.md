# Beating Bookies
Webapp used for the Beating Bookies comptetition. A list of rules and general structure of the competition and what the general guidelines were used when creating the project can be found in the rules PDF in the repository.

## Create New instance from GitHub
1. Install Git: First, ensure that Git is installed on your new system. 
    - You can download the Git installer for Windows from the official website (https://git-scm.com/download/win) and follow the installation instructions.

2. Install Python: If your project has Python dependencies, you'll need to install Python. Here's how you can do it:
    - Download the latest Python installer for Windows from the official website: https://www.python.org/downloads/windows/
    - Run the installer, and during installation, make sure to check the box that says "Add Python to PATH." This ensures that Python is added to your system's PATH environment variable.
    - Complete the installation process.
    - After installing Python, you can open a command prompt and check the Python version by running

        ```python --version```

    - This will confirm that Python is correctly installed.

3. Install Node.js and npm: If your project uses JavaScript or has npm dependencies, follow these steps:
    - Download the latest LTS (Long-Term Support) version of Node.js for Windows from the official website: https://nodejs.org/
    - Run the installer and follow the installation instructions.
    - After installation, open a command prompt and check the Node.js and npm versions by running

        ```node -v```

        ```npm -v```

    - This will confirm that Node.js and npm are correctly installed.

4. Clone the Git Repository:
    - Open a command prompt on your new system.
    - Navigate to the directory where you want to clone the project.
    - Use the git clone command to clone the repository. For example, if your project is hosted on GitHub and the repository URL is https://github.com/robomediaCODE/beatingbookies.git, you would run

        ```git clone https://github.com/robomediaCODE/beatingbookies```

5. Create a Virtual Python Environment
    - Navigate to your project's directory.

        ```cd your-repo-directory```

    - Create a virtual environment named 'venv_name'.

        ```python -m venv venv_name```

    - Activate virtual environment you just created.

        ```venv_name\Scripts\activate```

6. Install Project Dependencies: If your project has dependencies listed in a requirements.txt file (for Python) or a package.json file (for JavaScript/Node.js), you'll need to install them.
    - For Python, navigate to your project directory in the command prompt and run

        ```pip install -r requirements.txt```

    - For JavaScript/Node.js, navigate to your project directory and run

        ```npm install```

7. Check to ensure a .gitignore was created in the virtual environment folder. 
    - If file was not created, create a file called '.gitignore' and add this to the file:

        ```*```

    - This will ensure you do not push the virtual environment folder to the github project. 
