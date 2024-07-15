import json
import gi
gi.require_version('Gtk', '3.0')
from gi.repository import Gtk

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
    def __init__(self, editor):
        Gtk.Window.__init__(self, title="Script Editor")
        self.editor = editor

        self.set_default_size(800, 600)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        self.add(vbox)

        self.scene_liststore = Gtk.ListStore(str)
        self.update_scene_liststore()

        self.scene_combo = Gtk.ComboBox.new_with_model(self.scene_liststore)
        renderer_text = Gtk.CellRendererText()
        self.scene_combo.pack_start(renderer_text, True)
        self.scene_combo.add_attribute(renderer_text, "text", 0)
        vbox.pack_start(self.scene_combo, False, False, 0)

        self.scene_combo.connect("changed", self.on_scene_combo_changed)

        self.dialogue_textview = Gtk.TextView()
        vbox.pack_start(self.dialogue_textview, True, True, 0)

        self.choices_liststore = Gtk.ListStore(str, str)
        self.choices_treeview = Gtk.TreeView(model=self.choices_liststore)
        for i, column_title in enumerate(["Text", "Next Scene"]):
            renderer = Gtk.CellRendererText()
            column = Gtk.TreeViewColumn(column_title, renderer, text=i)
            self.choices_treeview.append_column(column)
        vbox.pack_start(self.choices_treeview, True, True, 0)

        button_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        vbox.pack_start(button_box, False, False, 0)

        self.add_scene_button = Gtk.Button(label="Add Scene")
        self.add_scene_button.connect("clicked", self.on_add_scene_clicked)
        button_box.pack_start(self.add_scene_button, True, True, 0)

        self.delete_scene_button = Gtk.Button(label="Delete Scene")
        self.delete_scene_button.connect("clicked", self.on_delete_scene_clicked)
        button_box.pack_start(self.delete_scene_button, True, True, 0)

        self.add_dialogue_button = Gtk.Button(label="Add Dialogue")
        self.add_dialogue_button.connect("clicked", self.on_add_dialogue_clicked)
        button_box.pack_start(self.add_dialogue_button, True, True, 0)

        self.delete_dialogue_button = Gtk.Button(label="Delete Dialogue")
        self.delete_dialogue_button.connect("clicked", self.on_delete_dialogue_clicked)
        button_box.pack_start(self.delete_dialogue_button, True, True, 0)

        self.add_choice_button = Gtk.Button(label="Add Choice")
        self.add_choice_button.connect("clicked", self.on_add_choice_clicked)
        button_box.pack_start(self.add_choice_button, True, True, 0)

        self.delete_choice_button = Gtk.Button(label="Delete Choice")
        self.delete_choice_button.connect("clicked", self.on_delete_choice_clicked)
        button_box.pack_start(self.delete_choice_button, True, True, 0)

    def update_scene_liststore(self):
        self.scene_liststore.clear()
        for scene in self.editor.list_scenes():
            self.scene_liststore.append([scene])

    def on_scene_combo_changed(self, combo):
        tree_iter = combo.get_active_iter()
        if tree_iter is not None:
            scene = combo.get_model()[tree_iter][0]
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
        dialog.set_default_size(150, 100)
        entry = Gtk.Entry()
        entry.set_text("new_scene")
        dialog.get_content_area().pack_start(entry, False, False, 0)
        entry.show()
        response = dialog.run()
        if response == Gtk.ResponseType.OK:
            scene_name = entry.get_text()
            if self.editor.add_scene(scene_name):
                self.update_scene_liststore()
            else:
                print(f"Scene '{scene_name}' already exists.")
        dialog.destroy()

    def on_delete_scene_clicked(self, button):
        tree_iter = self.scene_combo.get_active_iter()
        if tree_iter is not None:
            scene = self.scene_combo.get_model()[tree_iter][0]
            if self.editor.delete_scene(scene):
                self.update_scene_liststore()
                self.dialogue_textview.get_buffer().set_text("")
                self.choices_liststore.clear()
            else:
                print(f"Scene '{scene}' does not exist.")

    def on_add_dialogue_clicked(self, button):
        tree_iter = self.scene_combo.get_active_iter()
        if tree_iter is not None:
            scene = self.scene_combo.get_model()[tree_iter][0]
            dialog = Gtk.MessageDialog(
                transient_for=self,
                flags=0,
                message_type=Gtk.MessageType.QUESTION,
                buttons=Gtk.ButtonsType.OK_CANCEL,
                text="Enter character and dialogue:",
            )
            dialog.set_default_size(150, 100)
            character_entry = Gtk.Entry()
            character_entry.set_text("character")
            text_entry = Gtk.Entry()
            text_entry.set_text("dialogue")
            dialog.get_content_area().pack_start(character_entry, False, False, 0)
            dialog.get_content_area().pack_start(text_entry, False, False, 0)
            character_entry.show()
            text_entry.show()
            response = dialog.run()
            if response == Gtk.ResponseType.OK:
                character = character_entry.get_text()
                text = text_entry.get_text()
                if self.editor.add_dialogue(scene, character, text):
                    self.load_scene(scene)
                else:
                    print(f"Failed to add dialogue to scene '{scene}'.")
            dialog.destroy()

    def on_delete_dialogue_clicked(self, button):
        tree_iter = self.scene_combo.get_active_iter()
        if tree_iter is not None:
            scene = self.scene_combo.get_model()[tree_iter][0]
            buffer = self.dialogue_textview.get_buffer()
            start, end = buffer.get_bounds()
            dialogue_lines = buffer.get_text(start, end, True).split("\n")
            if dialogue_lines:
                self.editor.delete_dialogue(scene, len(dialogue_lines) - 1)
                self.load_scene(scene)

    def on_add_choice_clicked(self, button):
        tree_iter = self.scene_combo.get_active_iter()
        if tree_iter is not None:
            scene = self.scene_combo.get_model()[tree_iter][0]
            dialog = Gtk.MessageDialog(
                transient_for=self,
                flags=0,
                message_type=Gtk.MessageType.QUESTION,
                buttons=Gtk.ButtonsType.OK_CANCEL,
                text="Enter choice text and next scene:",
            )
            dialog.set_default_size(150, 100)
            text_entry = Gtk.Entry()
            text_entry.set_text("choice text")
            next_scene_entry = Gtk.Entry()
            next_scene_entry.set_text("next scene")
            dialog.get_content_area().pack_start(text_entry, False, False, 0)
            dialog.get_content_area().pack_start(next_scene_entry, False, False, 0)
            text_entry.show()
            next_scene_entry.show()
            response = dialog.run()
            if response == Gtk.ResponseType.OK:
                text = text_entry.get_text()
                next_scene = next_scene_entry.get_text()
                if self.editor.add_choice(scene, text, next_scene):
                    self.load_scene(scene)
                else:
                    print(f"Failed to add choice to scene '{scene}'.")
            dialog.destroy()

    def on_delete_choice_clicked(self, button):
        tree_iter = self.scene_combo.get_active_iter()
        if tree_iter is not None:
            scene = self.scene_combo.get_model()[tree_iter][0]
            selection = self.choices_treeview.get_selection()
            model, tree_iter = selection.get_selected()
            if tree_iter:
                choice_index = model.get_path(tree_iter).get_indices()[0]
                self.editor.delete_choice(scene, choice_index)
                self.load_scene(scene)

# Usage example
editor = ScriptEditor('./vn_script.json')
win = ScriptEditorGUI(editor)
win.connect("destroy", Gtk.main_quit)
win.show_all()
Gtk.main()
