import json
import gi
gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, Gio, Gdk

class ScriptEditor:
    def __init__(self, script_path):
        with open(script_path, 'r') as file:
            self.script = json.load(file)
        self.script_path = script_path

    def save_script(self):
        with open(self.script_path, 'w') as file:
            json.dump(self.script, file, indent=4)

    def list_scenes(self):
        return list(self.script.keys())

    def view_scene(self, scene):
        if scene in self.script:
            return self.script[scene]
        else:
            return None

    def add_scene(self, scene_name):
        if scene_name not in self.script:
            self.script[scene_name] = {"dialogue": [], "choices": []}
            self.save_script()
            return True
        else:
            return False

    def delete_scene(self, scene_name):
        if scene_name in self.script:
            del self.script[scene_name]
            self.save_script()
            return True
        else:
            return False

    def add_dialogue(self, scene, character, text):
        if scene in self.script:
            self.script[scene]["dialogue"].append({"character": character, "text": text})
            self.save_script()
            return True
        else:
            return False

    def delete_dialogue(self, scene, dialogue_index):
        if scene in self.script and 0 <= dialogue_index < len(self.script[scene]["dialogue"]):
            del self.script[scene]["dialogue"][dialogue_index]
            self.save_script()
            return True
        else:
            return False

    def add_choice(self, scene, text, next_scene):
        if scene in self.script:
            self.script[scene]["choices"].append({"text": text, "nextScene": next_scene})
            self.save_script()
            return True
        else:
            return False

    def delete_choice(self, scene, choice_index):
        if scene in self.script and 0 <= choice_index < len(self.script[scene]["choices"]):
            del self.script[scene]["choices"][choice_index]
            self.save_script()
            return True
        else:
            return False

class ScriptEditorGUI(Gtk.Window):
    def __init__(self):
        Gtk.Window.__init__(self, title="Script Editor")
        settings = Gtk.Settings.get_default()
        settings.set_property("gtk-application-prefer-dark-theme", True)
        for i in settings.list_properties():
            print(i)
        self.editor = None

        self.set_default_size(800, 600)

        main_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        self.add(main_box)

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "Script Editor"
        self.set_titlebar(header)

        # Icon names for buttons
        self.open_button = Gtk.Button.new_from_icon_name("document-open", Gtk.IconSize.BUTTON)
        self.open_button.connect("clicked", self.on_open_clicked)
        header.pack_start(self.open_button)

        self.scene_combo = Gtk.ComboBoxText()
        self.scene_combo.set_entry_text_column(0)
        self.scene_combo.connect("changed", self.on_scene_combo_changed)
        header.pack_start(self.scene_combo)

        self.add_scene_button = Gtk.Button.new_from_icon_name("list-add-symbolic", Gtk.IconSize.BUTTON)
        self.add_scene_button.connect("clicked", self.on_add_scene_clicked)
        header.pack_start(self.add_scene_button)

        self.delete_scene_button = Gtk.Button.new_from_icon_name("list-remove-symbolic", Gtk.IconSize.BUTTON)
        self.delete_scene_button.connect("clicked", self.on_delete_scene_clicked)
        header.pack_start(self.delete_scene_button)

        self.about_button = Gtk.Button.new_from_icon_name("help-about", Gtk.IconSize.BUTTON)
        self.about_button.connect("clicked", self.on_about_clicked)
        header.pack_end(self.about_button)

        paned = Gtk.Paned(orientation=Gtk.Orientation.VERTICAL)
        main_box.pack_start(paned, True, True, 0)

        # Dialogue section
        dialogue_frame = Gtk.Frame(label="Dialogue")
        dialogue_frame.set_shadow_type(Gtk.ShadowType.ETCHED_IN)
        paned.pack1(dialogue_frame, True, False)

        dialogue_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        dialogue_frame.add(dialogue_box)

        self.dialogue_textview = Gtk.TextView()
        self.dialogue_textview.set_wrap_mode(Gtk.WrapMode.WORD)
        dialogue_scroll = Gtk.ScrolledWindow()
        dialogue_scroll.add(self.dialogue_textview)
        dialogue_box.pack_start(dialogue_scroll, True, True, 0)

        dialogue_button_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        dialogue_box.pack_start(dialogue_button_box, False, False, 0)

        self.add_dialogue_button = Gtk.Button(label="Add Dialogue")
        self.add_dialogue_button.connect("clicked", self.on_add_dialogue_clicked)
        dialogue_button_box.pack_start(self.add_dialogue_button, True, True, 0)

        self.delete_dialogue_button = Gtk.Button(label="Delete Dialogue")
        self.delete_dialogue_button.connect("clicked", self.on_delete_dialogue_clicked)
        dialogue_button_box.pack_start(self.delete_dialogue_button, True, True, 0)

        # Choices section
        choices_frame = Gtk.Frame(label="Choices")
        choices_frame.set_shadow_type(Gtk.ShadowType.ETCHED_IN)
        paned.pack2(choices_frame, True, False)

        choices_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        choices_frame.add(choices_box)

        self.choices_liststore = Gtk.ListStore(str, str)
        self.choices_treeview = Gtk.TreeView(model=self.choices_liststore)
        for i, column_title in enumerate(["Text", "Next Scene"]):
            renderer = Gtk.CellRendererText()
            column = Gtk.TreeViewColumn(column_title, renderer, text=i)
            self.choices_treeview.append_column(column)
        choices_scroll = Gtk.ScrolledWindow()
        choices_scroll.add(self.choices_treeview)
        choices_box.pack_start(choices_scroll, True, True, 0)

        choices_button_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        choices_box.pack_start(choices_button_box, False, False, 0)

        self.add_choice_button = Gtk.Button(label="Add Choice")
        self.add_choice_button.connect("clicked", self.on_add_choice_clicked)
        choices_button_box.pack_start(self.add_choice_button, True, True, 0)

        self.delete_choice_button = Gtk.Button(label="Delete Choice")
        self.delete_choice_button.connect("clicked", self.on_delete_choice_clicked)
        choices_button_box.pack_start(self.delete_choice_button, True, True, 0)

    def on_open_clicked(self, button):
        dialog = Gtk.FileChooserDialog(
            title="Please choose a file", parent=self, action=Gtk.FileChooserAction.OPEN
        )
        dialog.add_buttons(
            Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL, Gtk.STOCK_OPEN, Gtk.ResponseType.OK
        )

        filter_json = Gtk.FileFilter()
        filter_json.set_name("JSON files")
        filter_json.add_mime_type("application/json")
        dialog.add_filter(filter_json)

        response = dialog.run()
        if response == Gtk.ResponseType.OK:
            file_path = dialog.get_filename()
            self.editor = ScriptEditor(file_path)
            self.update_scene_combo()
            header = self.get_titlebar()
            header.props.subtitle = file_path
        
        dialog.destroy()

    def update_scene_combo(self):
        active_scene = self.scene_combo.get_active_text()
        self.scene_combo.remove_all()
        for scene in self.editor.list_scenes():
            self.scene_combo.append_text(scene)
        if active_scene:
            self.scene_combo.set_active_id(active_scene)
        elif self.editor.list_scenes():
            self.scene_combo.set_active(0)

    def on_scene_combo_changed(self, combo):
        scene = combo.get_active_text()
        if scene:
            self.load_scene(scene)

    def load_scene(self, scene):
        scene_data = self.editor.view_scene(scene)
        if scene_data:
            buffer = self.dialogue_textview.get_buffer()
            buffer.set_text("\n".join([f'{d["character"]}: {d["text"]}' for d in scene_data["dialogue"]]))
            self.choices_liststore.clear()
            for choice in scene_data["choices"]:
                self.choices_liststore.append([choice["text"], choice["nextScene"]])

    def on_add_scene_clicked(self, button):
        dialog = Gtk.MessageDialog(
            transient_for=self,
            flags=0,
            message_type=Gtk.MessageType.QUESTION,
            buttons=Gtk.ButtonsType.OK_CANCEL,
            text="Enter new scene name:",
        )
        dialog.set_default_size(300, 100)
        entry = Gtk.Entry()
        entry.set_text("new_scene")
        dialog.get_content_area().pack_start(entry, True, True, 0)
        entry.show()
        response = dialog.run()
        if response == Gtk.ResponseType.OK:
            scene_name = entry.get_text()
            if self.editor.add_scene(scene_name):
                self.update_scene_combo()
                self.scene_combo.set_active_id(scene_name)
            else:
                self.show_error_dialog(f"Scene '{scene_name}' already exists.")
        dialog.destroy()

    def on_delete_scene_clicked(self, button):
        scene = self.scene_combo.get_active_text()
        if scene:
            if self.editor.delete_scene(scene):
                self.update_scene_combo()
                self.dialogue_textview.get_buffer().set_text("")
                self.choices_liststore.clear()
            else:
                self.show_error_dialog(f"Scene '{scene}' does not exist.")

    def on_add_dialogue_clicked(self, button):
        scene = self.scene_combo.get_active_text()
        if scene:
            dialog = Gtk.MessageDialog(
                transient_for=self,
                flags=0,
                message_type=Gtk.MessageType.QUESTION,
                buttons=Gtk.ButtonsType.OK_CANCEL,
                text="Enter character and dialogue:",
            )
            dialog.set_default_size(300, 150)
            character_entry = Gtk.Entry()
            character_entry.set_text("character")
            text_entry = Gtk.Entry()
            text_entry.set_text("dialogue")
            dialog.get_content_area().pack_start(character_entry, True, True, 0)
            dialog.get_content_area().pack_start(text_entry, True, True, 0)
            dialog.show_all()
            response = dialog.run()
            if response == Gtk.ResponseType.OK:
                character = character_entry.get_text()
                text = text_entry.get_text()
                if self.editor.add_dialogue(scene, character, text):
                    self.load_scene(scene)
                else:
                    self.show_error_dialog(f"Failed to add dialogue to scene '{scene}'.")
            dialog.destroy()

    def on_delete_dialogue_clicked(self, button):
        scene = self.scene_combo.get_active_text()
        if scene:
            buffer = self.dialogue_textview.get_buffer()
            start, end = buffer.get_bounds()
            dialogue_lines = buffer.get_text(start, end, True).split("\n")
            if dialogue_lines:
                self.editor.delete_dialogue(scene, len(dialogue_lines) - 1)
                self.load_scene(scene)

    def on_add_choice_clicked(self, button):
        scene = self.scene_combo.get_active_text()
        if scene:
            dialog = Gtk.MessageDialog(
                transient_for=self,
                flags=0,
                message_type=Gtk.MessageType.QUESTION,
                buttons=Gtk.ButtonsType.OK_CANCEL,
                text="Enter choice text and next scene:",
            )
            dialog.set_default_size(300, 150)
            text_entry = Gtk.Entry()
            text_entry.set_text("choice text")
            next_scene_entry = Gtk.Entry()
            next_scene_entry.set_text("next scene")
            dialog.get_content_area().pack_start(text_entry, True, True, 0)
            dialog.get_content_area().pack_start(next_scene_entry, True, True, 0)
            dialog.show_all()
            response = dialog.run()
            if response == Gtk.ResponseType.OK:
                text = text_entry.get_text()
                next_scene = next_scene_entry.get_text()
                if self.editor.add_choice(scene, text, next_scene):
                    self.load_scene(scene)
                else:
                    self.show_error_dialog(f"Failed to add choice to scene '{scene}'.")
            dialog.destroy()

    def on_delete_choice_clicked(self, button):
        scene = self.scene_combo.get_active_text()
        if scene:
            selection = self.choices_treeview.get_selection()
            model, tree_iter = selection.get_selected()
            if tree_iter:
                choice_index = model.get_path(tree_iter).get_indices()[0]
                self.editor.delete_choice(scene, choice_index)
                self.load_scene(scene)

    def on_about_clicked(self, button):
        about_dialog = Gtk.AboutDialog()
        about_dialog.set_program_name("VnScript Editor")
        about_dialog.set_version("1.0")
        about_dialog.set_authors(["cmdada"])
        about_dialog.set_comments("Quick GTK3 app to edit vn_script.json files for TableBuildingDatingSimulatorNG.")
        about_dialog.run()
        about_dialog.destroy()

    def show_error_dialog(self, message):
        dialog = Gtk.MessageDialog(
            transient_for=self,
            flags=0,
            message_type=Gtk.MessageType.ERROR,
            buttons=Gtk.ButtonsType.OK,
            text=message,
        )
        dialog.run()
        dialog.destroy()
win = ScriptEditorGUI()
win.connect("destroy", Gtk.main_quit)
win.show_all()
Gtk.main()
