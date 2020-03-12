# Contributing

All types of contribution are very welcome, whether it's a bug report, idea or pull request!

Please follow the official [Jupyter Code of Conduct](https://github.com/jupyter/governance/blob/master/conduct/code_of_conduct.md).

## Setup

```bash
# Create a new environment using `conda`
conda create -c conda-forge -n jupyterlab-python-bytecode yarn nodejs jupyterlab

# Activate it
conda activate jupyterlab-python-code

# Install the dependencies
jlpm

# Build the extension
jlpm run build

# Link the JupyterLab extension
jupyter labextension link .
```

To double check the extension has been linked correctly, run:

`jupyter labextension list`

The command should return something similar to the following:

```
JupyterLab v2.0.1
Known labextensions:
   app dir: /path/to/miniconda/envs/jupyterlab-python-bytecode/share/jupyter/lab
        jupyterlab-python-bytecode v0.1.0  enabled  OK*

   local extensions:
        jupyterlab-python-bytecode: /path/to/git/repo/jupyterlab-python-bytecode
```

Finally, start JupyterLab in watch mode:

`jupyter lab --watch`

## Workflow

To rebuild the package and the JupyterLab app:

```bash
# Build the extension
jlpm run build

# Rebuild JupyterLab
jupyter lab build
```

It is also possible to use the `watch` script to automatically rebuild the extension whenever there is a change:

```bash
# Start JupyterLab in watch mode to pick-up changes automatically
jupyter lab --watch

# Start the watch script
jlpm run watch
```

## Tests

To run the tests:

`jlpm run test`
