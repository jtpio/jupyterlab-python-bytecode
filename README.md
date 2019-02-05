# jupyterlab-python-bytecode

[![Build Status](https://travis-ci.com/jtpio/jupyterlab-python-bytecode.svg?branch=master)](https://travis-ci.com/jtpio/jupyterlab-python-bytecode)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jtpio/jupyterlab-python-bytecode/stable?urlpath=lab/tree/doc/example.py)
[![npm](https://img.shields.io/npm/v/jupyterlab-python-bytecode.svg)](https://www.npmjs.com/package/jupyterlab-python-bytecode)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

JupyterLab extension to inspect Python Bytecode.

![screencast](./doc/live_update.gif)

## Try it online

Try the extension in your browser with Binder:

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jtpio/jupyterlab-python-bytecode/stable?urlpath=lab/tree/doc/example.py)

## Prerequisites

- JupyterLab 0.35
- `ipykernel`

To install JupyterLab:

```bash
conda install -c conda-forge jupyterlab
```

## Installation

```bash
jupyter labextension install jupyterlab-python-bytecode
```

## Features

- Live Bytecode preview
- Choose the kernel for a file (if not already started). This allows comparing the bytecode output for different versions of Python.
- Check the `Avanced Settings Editor` to tweak some of the settings

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) to know how to contribute and setup a development environment.

## How it works

Disassembling the Python code is done by connecting to a kernel, and sending the following code for evaluation from the lab extension:

```python
import dis
dis.dis(code_to_evaluate)
```

[As mentioned in the documentation](https://docs.python.org/3/library/dis.html), there is not guarantee on the stability of the bytecode across Python versions:

> Bytecode is an implementation detail of the CPython interpreter. No guarantees are made that bytecode will not be added, removed, or changed between versions of Python. Use of this module should not be considered to work across Python VMs or Python releases.

## Example

For example, if the Python file contains the following lines:

```python
import math

print(math.pi)
```

The following code will be sent to the kernel for evaluation:

```python
import dis
dis.dis("""
import math

print(math.pi)
""")
```

Which will return (example for CPython 3.6.6):

```python
  1           0 LOAD_CONST               0 (0)
              2 LOAD_CONST               1 (None)
              4 IMPORT_NAME              0 (math)
              6 STORE_NAME               0 (math)

  3           8 LOAD_NAME                1 (print)
             10 LOAD_NAME                0 (math)
             12 LOAD_ATTR                2 (pi)
             14 CALL_FUNCTION            1
             16 POP_TOP
             18 LOAD_CONST               1 (None)
             20 RETURN_VALUE
```

### Comparing versions of CPython

If you have several versions of Python installed on your machine (let's say in different conda environments), you can use the extension to check how the bytecode might differ.

The following example illustrates the introduction of the new `CALL_METHOD` opcode introduced in CPython 3.7:

![python_comparison](./doc/py36_py37_comparison.gif)

### Comparing for and while loops

Original example from [Disassembling Python Bytecode, by Peter Goldsborough](http://www.goldsborough.me/python/low-level/2016/10/04/00-31-30-disassembling_python_bytecode/)

![for_while](./doc/for_while.gif)
