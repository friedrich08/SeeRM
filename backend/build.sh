#!/usr/bin/env bash
# exit on error
set -o errexit

# Set CARGO_HOME to a writable directory for Rust-based packages
export CARGO_HOME=$HOME/.cargo

python --version
pip install --upgrade pip setuptools wheel
pip install python-bidi==0.4.2
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
