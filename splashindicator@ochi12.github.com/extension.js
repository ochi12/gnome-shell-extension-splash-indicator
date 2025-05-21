/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import Shell from 'gi://Shell';
import Clutter from 'gi://Clutter';

const SplashIndicator = GObject.registerClass(
class SplashIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('Splash Indicator'));

        this._icontheme = new St.IconTheme();

        const desaturateEffect = new Clutter.DesaturateEffect({factor: 1.0});
        this._icon = new St.Icon({
            style_class: 'system-status-icon',
        });
        this._icon.add_effect(desaturateEffect);

        this._label = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
        });

        const box = new St.BoxLayout({
            vertical: false,
            style_class: 'panel-button',
        });
        box.add_child(this._icon);
        box.add_child(this._label);
        this.add_child(box);

        let item = new PopupMenu.PopupMenuItem(_('Show Notification'));
        item.connect('activate', () => {
            Main.notify(_('Whatʼs up, folks?'));
        });
        this.menu.addMenuItem(item);
    }

    _setIcon(iconName) {
        if (this._icontheme.has_icon(iconName)) {
            this._icon.gicon = Gio.ThemedIcon.new(iconName);
        } else {
            // for non symbolic icons
            const parts = iconName.split('-');
            const finalIconName = parts.slice(0, -1).join('-');
            console.log(`icon name: ${finalIconName}`);
            this._icon.gicon = Gio.icon_new_for_string(finalIconName);
        }
    }

    _setLabel(appName) {
        this._label.set_text(appName);
    }

    fade_in(iconName, appName) {
        this._setIcon(`${iconName}-symbolic`);
        this._setLabel(_(`Launching ${appName}...`));

        this.remove_all_transitions();
        this.opacity = 0;
        this.show();

        this.ease({
            opacity: 255,
            duration: 100, // in ms
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => {
                this.show();
            },
        });
    }

    fade_out() {
        this.remove_all_transitions();
        this.ease({
            opacity: 0,
            duration: 350, // in ms
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => {
                this.hide();
            },
        });
    }
});

class AppLaunchMonitor {
    constructor(indicator) {
        this._indicator = indicator;
        this._startingApps = [];
        this._fadeOutDelayId = null;

        this._appMonitor = Shell.AppSystem.get_default();
        this._appStateChangedId = this._appMonitor.connect(
            'app-state-changed',
            this._onAppStateChanged.bind(this)
        );
    }

    _onAppStateChanged(appSystem, app) {
        const appState = app.state;
        const appId = app.id;

        if (appState === Shell.AppState.STARTING) {
            if (!this._startingApps.find(_app => _app.id === appId)) {
                this._startingApps.push(app);

                const appName = app.get_name();
                const iconName = app.icon.to_string();
                this._indicator.fade_in(iconName, appName);
            }

            if (this._fadeOutDelayId !== null) {
                GLib.source_remove(this._fadeOutDelayId);
                this._fadeOutDelayId = null;
            }
        } else {
            this._startingApps = this._startingApps.filter(_app => _app.id !== appId);

            if (this._startingApps.length > 0) {
                const previousApp = this._startingApps[this._startingApps.length - 1];
                const appName = previousApp.get_name();
                const iconName = previousApp.icon.to_string();
                this._indicator.fade_in(iconName, appName);
            } else {
                this._fadeOutDelayId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                    this._indicator.fade_out();
                    return GLib.SOURCE_REMOVE;
                });
            }
        }
    }

    destroy() {
        this._appMonitor.disconnect(this._appStateChangedId);
        this._appMonitor = null;
        this._startingApps = [];
        this._fadeOutDelayId = null;
    }
}

export default class IndicatorExampleExtension extends Extension {
    enable() {
        this._indicator = new SplashIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator, -1, 'left');

        this._appMonitor = new AppLaunchMonitor(this._indicator);
    }

    disable() {
        this._appMonitor.destroy();
        this._appMonitor = null;

        this._indicator.destroy();
        this._indicator = null;
    }
}
