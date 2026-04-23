#!/bin/bash
# Called by PostgreSQL's archive_command
# Usage: archive_command = '/wal-archive.sh %p %f'
# %p = full path to WAL file, %f = filename only

/usr/local/bin/wal-g wal-push "$1"
