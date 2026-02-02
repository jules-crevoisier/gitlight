#!/bin/bash

# Setup SSH server for Git access
# This script configures OpenSSH for Git repository access

set -e

SSH_DIR="/etc/ssh"
AUTHORIZED_KEYS_DIR="/etc/ssh/authorized_keys.d"
GIT_USER="git"
REPOS_PATH="/data/repositories"

# Create git user if it doesn't exist
if ! id -u "$GIT_USER" > /dev/null 2>&1; then
    adduser --disabled-password --gecos "" --home /home/$GIT_USER $GIT_USER
    echo "$GIT_USER:*" | chpasswd -e
fi

# Create directories
mkdir -p "$AUTHORIZED_KEYS_DIR"
mkdir -p "$REPOS_PATH"
chown -R $GIT_USER:$GIT_USER "$REPOS_PATH"

# Configure SSHD
cat > "$SSH_DIR/sshd_config.d/gitlight.conf" << 'EOF'
# GitLight SSH Configuration
AuthorizedKeysFile /etc/ssh/authorized_keys.d/%u

# Security settings
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM no
PermitRootLogin no

# Git-specific settings
AllowUsers git
Match User git
    X11Forwarding no
    AllowTcpForwarding no
    PermitTTY no
    ForceCommand /usr/bin/git-shell -c "$SSH_ORIGINAL_COMMAND"
EOF

# Create git-shell commands directory
mkdir -p /home/$GIT_USER/git-shell-commands
chmod 755 /home/$GIT_USER/git-shell-commands

# Create no-interactive-login message
cat > /home/$GIT_USER/git-shell-commands/no-interactive-login << 'EOF'
#!/bin/bash
echo "GitLight: Interactive login is disabled."
exit 128
EOF
chmod +x /home/$GIT_USER/git-shell-commands/no-interactive-login

echo "SSH setup complete for GitLight"
