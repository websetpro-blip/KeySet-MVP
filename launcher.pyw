import os
from pathlib import Path

from launcher import main


if __name__ == "__main__":
    os.chdir(Path(__file__).resolve().parent)
    main()
