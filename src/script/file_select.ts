export async function show_file_select(accept: string): Promise<File | undefined> {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = accept;

	const file_result = new Promise<File | undefined>(resolve => {
		const on_change: EventListener = () => {
			input.removeEventListener("change", on_change);
			input.removeEventListener("cancel", on_change);
			resolve(input.files![0] ?? undefined);
		}
		input.addEventListener("change", on_change);
		input.addEventListener("cancel", on_change);
	});

	input.click();
	return file_result;
}
