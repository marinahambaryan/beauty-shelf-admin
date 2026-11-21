import { choosePhoto } from "@/actions/photos";
import { ActionForm, SubmitButton } from "@/components/form";
import type { Photo } from "@/lib/photo-sources";

function Grid({ photos, kind, name }: { photos: Photo[]; kind: "obf" | "page"; name: string }) {
  return (
    <div className="page-photos">
      {photos.map((p, i) => (
        <label key={p.full} className="page-photo">
          <input
            type="radio"
            name="photo"
            value={kind === "obf" ? `obf|${p.full}|${p.small}` : `page|${p.full}`}
            aria-label={`${kind === "obf" ? "Open Beauty Facts" : "Shop"} photo ${i + 1} of ${name}`}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- remote photos, shown to choose from */}
          <img src={p.thumb} alt="" referrerPolicy="no-referrer" loading="lazy" />
        </label>
      ))}
    </div>
  );
}

/**
 * Choosing a catalogue photo (D44): Open Beauty Facts photos for the product's barcodes, photos
 * from a shop page the admin pastes (only with permission), or an upload. Plain radios and a GET
 * form for the shop page, so it all works before the page hydrates.
 */
export function PhotoPicker({
  productId,
  name,
  obf,
  page,
  open,
}: {
  productId: string;
  name: string;
  obf: Photo[];
  page: { url: string; host: string; photos: Photo[]; error: string | null } | null;
  open: boolean;
}) {
  return (
    <details className="photo-picker" open={open}>
      <summary>Choose another photo</summary>

      <form method="get" className="stack photo-lookup">
        <label className="field">
          <span>Photos from a shop or brand page</span>
          <input type="url" name="photosFrom" defaultValue={page?.url} placeholder="https://" required />
        </label>
        <button type="submit" className="button button-quiet">Find photos</button>
      </form>

      <ActionForm action={choosePhoto.bind(null, productId, name)} className="image-choice">
        {page && (
          <>
            <span className="option-title">From {page.host}</span>
            {page.error ? <p className="aside">{page.error}</p> : <Grid photos={page.photos} kind="page" name={name} />}
            {page.photos.length > 0 && (
              <>
                <label className="option">
                  <input type="checkbox" name="permission" />
                  <span>The brand or shop allows us to use this photo</span>
                </label>
                <small>Shop photos belong to the brand. Use one only with permission.</small>
              </>
            )}
          </>
        )}

        <span className="option-title">From Open Beauty Facts</span>
        {obf.length > 0 ? (
          <>
            <Grid photos={obf} kind="obf" name={name} />
            <small>Free to use with credit. The app shows the credit under the photo.</small>
          </>
        ) : (
          <p className="aside">No photos for this product&rsquo;s barcodes. Add a barcode to a shade or size to look there.</p>
        )}

        <label className="option">
          <input type="radio" name="photo" value="upload" />
          <span>Upload an image</span>
        </label>
        <input type="file" name="image" accept="image/webp,image/png,image/jpeg" aria-label="Image to upload" />
        <small>WebP, PNG or JPG, up to 2 MB, on a plain background. Use images you have the rights to.</small>

        <div className="actions">
          <SubmitButton>Use this photo</SubmitButton>
        </div>
      </ActionForm>
    </details>
  );
}
