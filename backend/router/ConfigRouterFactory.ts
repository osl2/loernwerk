import { Router } from 'express';
import { RouterFactory } from './RouterFactory';
import { ConfigController } from '../controller/ConfigController';
import { requireAdmin, requireBody, requireLogin } from '../loernwerkUtilities';
import { ConfigKey } from '../../model/configuration/ConfigKey';

/**
 * Builds router for requests regarding configuration (by admin).
 */
export class ConfigRouterFactory extends RouterFactory {
    /**
     * Builds router for configuration management
     * @returns built router
     */
    public buildRouter(): Router {
        const configRouter = Router();

        configRouter.patch(
            '/:key',
            requireAdmin,
            requireBody('value'),
            async (req, res) => {
                try {
                    await ConfigController.setConfigEntry(
                        req.params.key as ConfigKey,
                        req.body.value
                    );
                    res.sendStatus(204);
                } catch {
                    res.sendStatus(404);
                }
            }
        );

        configRouter.get('/', requireAdmin, async (req, res) => {
            const allConfigEntries =
                await ConfigController.getAllConfigEntries();
            res.status(200).json(allConfigEntries);
        });

        configRouter.get('/:key', requireLogin, async (req, res) => {
            try {
                const value = await ConfigController.getConfigEntry(
                    req.params.key as ConfigKey
                );
                res.status(200).json(value);
            } catch {
                res.sendStatus(404);
            }
        });

        return configRouter;
    }
}
