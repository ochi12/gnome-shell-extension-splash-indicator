# Splash Indicator
A simple and non-obstructive way to show currently launching applications.

## How it all started
I was not contended on gnomes startup notify implementation (the mouse pointer loading wheel wen launching apps). It disappears when pointer is not placed in proper locations (top bar or dock). Then I decided to try and implement some kind of third party splash screen for each apps but then it must be non-obstructive. Instead of a splash screen window I decided to turn it into a simple panel indicator.

## Reminder
- only apps with enable `startup-notify` works for this extension
- apps with no symbolic icons or given the path will automatically fallback to a greyed out desktop icon.

# Installation
```bash
$ git clone https://github.com/ochi12/gnome-shell-extension-splash-indicator.git
$ make build
$ make install
```
